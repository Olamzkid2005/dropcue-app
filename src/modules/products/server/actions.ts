"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePublicId } from "@/lib/security/tokens";
import { logAuditEvent } from "@/lib/audit";
import { createProductSchema, updateProductSchema } from "../validations";
import type { CreateProductInput, UpdateProductInput, ProductWithFiles } from "../types";
import { revalidatePath } from "next/cache";

async function ensureCreator(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string
) {
  const { data } = await supabase.from("creators").select("id").eq("id", userId).single();
  if (!data) {
    await supabase.from("creators").insert({ id: userId, email });
  }
}

export async function createProduct(input: CreateProductInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated", product: null };
  }

  // Ensure creator record exists (handles users who signed up before migration)
  await ensureCreator(supabase, user.id, user.email ?? "");

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
      product: null,
    };
  }

  const publicId = generatePublicId();

  // Convert naira to kobo for storage
  const koboAmount = Math.round(parsed.data.price_amount * 100);

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      public_id: publicId,
      creator_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price_amount: koboAmount,
      currency: parsed.data.currency,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message, product: null };
  }

  await logAuditEvent("product_created", "product", product.id, {
    name: product.name,
    price_amount: product.price_amount,
  });

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");

  return { success: true, error: null, product };
}

export async function updateProduct(productId: string, input: UpdateProductInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated", product: null };
  }

  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
      product: null,
    };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("products")
    .select("id, creator_id")
    .eq("id", productId)
    .single();

  if (!existing || existing.creator_id !== user.id) {
    return { success: false, error: "Product not found", product: null };
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.price_amount !== undefined) updateData.price_amount = Math.round(parsed.data.price_amount * 100);
  if (parsed.data.status !== undefined) {
    if (parsed.data.status === "published") {
      const { count } = await supabase
        .from("files")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId)
        .eq("status", "uploaded");
      if (!count) {
        return {
          success: false,
          error: "Upload at least one file before publishing",
          product: null,
        };
      }
    }
    updateData.status = parsed.data.status;
  }

  const { data: product, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message, product: null };
  }

  if (parsed.data.status === "archived") {
    await supabase
      .from("files")
      .update({
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("product_id", productId)
      .is("expires_at", null);
    await logAuditEvent("product_archived", "product", product.id);
  } else if (parsed.data.status === "published") {
    await supabase
      .from("files")
      .update({ expires_at: null })
      .eq("product_id", productId);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath(`/products/${productId}`);

  return { success: true, error: null, product };
}

export async function deleteProduct(productId: string, permanent = false) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("products")
    .select("id, creator_id, name")
    .eq("id", productId)
    .single();

  if (!existing || existing.creator_id !== user.id) {
    return { success: false, error: "Product not found" };
  }

  // Purchased products remain financial history. Archive by default so
  // existing orders and delivery records keep their product reference.
  // Permanent deletion is only possible for products with no orders —
  // enforced by the permanently_delete_product RPC (migration 006).
  if (permanent) {
    const { data: deleted, error } = await supabase.rpc(
      "permanently_delete_product",
      { p_product_id: productId }
    );

    if (error) {
      return { success: false, error: error.message };
    }
    if (!deleted) {
      return {
        success: false,
        error: "Product could not be permanently deleted",
      };
    }

    await logAuditEvent("product_deleted", "product", productId, {
      name: existing.name,
      requested_action: "permanent_delete",
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");

    return { success: true, error: null };
  }

  const { error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId)
    .eq("creator_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase
    .from("files")
    .update({
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("product_id", productId)
    .is("expires_at", null);

  await logAuditEvent("product_archived", "product", productId, {
    name: existing.name,
    requested_action: "archive",
  });

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/products");

  return { success: true, error: null };
}

export async function getProducts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { products: [] };
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  return { products: products ?? [] };
}

export async function getProduct(productId: string): Promise<{ product: ProductWithFiles | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { product: null };
  }

  const { data: product } = await supabase
    .from("products")
    .select("*, files(*)")
    .eq("id", productId)
    .eq("creator_id", user.id)
    .single();

  return { product };
}

export async function getPublicProduct(publicId: string): Promise<{ product: ProductWithFiles | null }> {
  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("*, files(id, product_id, original_filename, mime_type, file_size, status, expires_at, created_at)")
    .eq("public_id", publicId)
    .eq("status", "published")
    .maybeSingle();

  if (!product) return { product: null };

  // Only return uploaded files
  const uploadedFiles = (product as ProductWithFiles).files.filter(
    (f) => f.status === "uploaded"
  );

  return { product: { ...product, files: uploadedFiles } as ProductWithFiles };
}
