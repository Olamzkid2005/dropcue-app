"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseStorage } from "@/lib/storage";
import { uploadUrlSchema, uploadCompleteSchema } from "../validations";
import { FILE_LIMITS } from "../types";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

function generateStorageKey(productId: string, fileName: string): string {
  const uniqueId = randomBytes(8).toString("hex");
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${productId}/${uniqueId}_${safeName}`;
}

export async function createUploadUrl(input: {
  product_id: string;
  file_name: string;
  file_size: number;
  content_type: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated", data: null };
  }

  // Validate input
  const parsed = uploadUrlSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
      data: null,
    };
  }

  // Verify product ownership
  const { data: product } = await supabase
    .from("products")
    .select("id, creator_id")
    .eq("id", input.product_id)
    .single();

  if (!product || product.creator_id !== user.id) {
    return { success: false, error: "Product not found", data: null };
  }

  // Check file count limit
  const { count } = await supabase
    .from("files")
    .select("*", { count: "exact", head: true })
    .eq("product_id", input.product_id);

  if ((count ?? 0) >= FILE_LIMITS.maxFilesPerProduct) {
    return {
      success: false,
      error: `Maximum ${FILE_LIMITS.maxFilesPerProduct} files per product`,
      data: null,
    };
  }

  // Check total product size
  const { data: existingFiles } = await supabase
    .from("files")
    .select("file_size")
    .eq("product_id", input.product_id);

  const totalSize = (existingFiles ?? []).reduce(
    (sum: number, f: { file_size: number }) => sum + f.file_size,
    0
  );
  if (totalSize + input.file_size > FILE_LIMITS.maxTotalProductSize) {
    return {
      success: false,
      error: "Total product size would exceed 2 GB limit",
      data: null,
    };
  }

  // Generate storage key
  const storageKey = generateStorageKey(input.product_id, input.file_name);

  // Create file record
  const { data: fileRecord, error: insertError } = await supabase
    .from("files")
    .insert({
      product_id: input.product_id,
      original_filename: input.file_name,
      storage_key: storageKey,
      mime_type: input.content_type,
      file_size: input.file_size,
      status: "uploading",
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: insertError.message, data: null };
  }

  // Generate signed upload URL
  try {
    const { upload_url } = await supabaseStorage.generateUploadUrl(storageKey, {
      content_type: input.content_type,
    });

    return {
      success: true,
      error: null,
      data: {
        upload_url,
        file_id: fileRecord.id,
        storage_key: storageKey,
      },
    };
  } catch (err) {
    // Clean up file record if URL generation fails
    await supabase.from("files").delete().eq("id", fileRecord.id);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate upload URL",
      data: null,
    };
  }
}

export async function completeUpload(input: {
  file_id: string;
  product_id: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate input
  const parsed = uploadCompleteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  // Verify file exists and product ownership
  const { data: file } = await supabase
    .from("files")
    .select("id, product_id, storage_key, status")
    .eq("id", input.file_id)
    .eq("status", "uploading")
    .single();

  if (!file) {
    return { success: false, error: "File not found" };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, creator_id")
    .eq("id", input.product_id)
    .single();

  if (!product || product.creator_id !== user.id) {
    return { success: false, error: "Product not found" };
  }

  if (file.product_id !== input.product_id) {
    return { success: false, error: "File does not belong to this product" };
  }

  // Verify the object exists before making it purchasable.
  try {
    const lastSlash = file.storage_key.lastIndexOf("/");
    const folder = lastSlash === -1 ? "" : file.storage_key.slice(0, lastSlash);
    const filename = file.storage_key.slice(lastSlash + 1);
    const { data: objects, error: storageError } = await createAdminClient()
      .storage
      .from("products")
      .list(folder, { search: filename, limit: 1 });
    if (storageError || !objects?.some((object) => object.name === filename)) {
      return { success: false, error: "Uploaded file was not found" };
    }
  } catch {
    return { success: false, error: "Could not verify uploaded file" };
  }

  // Update file status to uploaded
  const { data: updatedFile, error } = await supabase
    .from("files")
    .update({ status: "uploaded" })
    .eq("id", input.file_id)
    .eq("product_id", input.product_id)
    .eq("status", "uploading")
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!updatedFile) return { success: true };

  // Auto-evaluate product status
  await evaluateProductStatus(input.product_id);

  revalidatePath("/");
  revalidatePath(`/products/${input.product_id}`);

  return { success: true };
}

export async function deleteFile(fileId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get file and verify ownership
  const { data: file } = await supabase
    .from("files")
    .select("id, storage_key, product_id")
    .eq("id", fileId)
    .single();

  if (!file) {
    return { success: false, error: "File not found" };
  }

  const { data: product } = await supabase
    .from("products")
    .select("creator_id")
    .eq("id", file.product_id)
    .single();

  if (!product || product.creator_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  // Delete from storage
  try {
    await supabaseStorage.deleteFile(file.storage_key);
  } catch {
    // File may not exist in storage yet, continue with DB cleanup
  }

  // Delete from database
  const { error } = await supabase.from("files").delete().eq("id", fileId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Re-evaluate product status
  await evaluateProductStatus(file.product_id);

  revalidatePath("/");
  revalidatePath(`/products/${file.product_id}`);

  return { success: true };
}

/**
 * Auto-evaluate product status based on files and price.
 * If product has valid price + at least 1 uploaded file → published
 * Otherwise → draft
 */
async function evaluateProductStatus(productId: string) {
  const admin = createAdminClient();

  // Product + uploaded-file count in parallel (was 2 sequential round-trips)
  const [{ data: product }, { count }] = await Promise.all([
    admin
      .from("products")
      .select("price_amount, status")
      .eq("id", productId)
      .single(),
    admin
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId)
      .eq("status", "uploaded"),
  ]);

  if (!product) return;

  const hasFiles = (count ?? 0) > 0;
  const hasValidPrice = product.price_amount > 0;

  if (product.status === "draft" && hasFiles && hasValidPrice) {
    await admin
      .from("products")
      .update({ status: "published" })
      .eq("id", productId);
  } else if (product.status === "published" && (!hasFiles || !hasValidPrice)) {
    await admin
      .from("products")
      .update({ status: "draft" })
      .eq("id", productId);
  }
}

export async function getFilesForProduct(productId: string) {
  const admin = createAdminClient();

  const { data: files } = await admin
    .from("files")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  return files ?? [];
}
