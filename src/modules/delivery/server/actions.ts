import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseStorage } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";
import type { DeliveryWithOrder, DeliveryFile, DeliveryStatus } from "../types";

const SIGNED_URL_EXPIRY_SECONDS = 600; // 10 minutes

/**
 * Resolve a delivery token into full delivery info with order, product, and files.
 * This is the core function that validates access.
 */
export async function resolveDeliveryToken(
  token: string
): Promise<{
  delivery: DeliveryWithOrder | null;
  status: DeliveryStatus;
  error?: string;
}> {
  const admin = createAdminClient();

  // 1. Find delivery by token
  const { data: delivery, error: deliveryError } = await admin
    .from("deliveries")
    .select("*")
    .eq("delivery_token", token)
    .single();

  if (deliveryError || !delivery) {
    return { delivery: null, status: "invalid", error: "Invalid download link" };
  }

  // 2. Check if token has expired
  if (new Date(delivery.expires_at) < new Date()) {
    // Mark as expired
    await admin
      .from("deliveries")
      .update({ status: "expired" })
      .eq("id", delivery.id);

    return { delivery: null, status: "expired" };
  }

  // 3. Check if revoked
  if (delivery.status === "revoked") {
    return { delivery: null, status: "expired", error: "Download link has been revoked" };
  }

  // 4. Check download limit
  if (delivery.download_count >= delivery.max_downloads) {
    return {
      delivery: null,
      status: "expired",
      error: "Download limit reached",
    };
  }

  // 5. Get order
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", delivery.order_id)
    .single();

  if (!order || order.status !== "paid") {
    return { delivery: null, status: "processing" };
  }

  // 6. Get product
  const { data: product } = await admin
    .from("products")
    .select("id, name, description, creator_id")
    .eq("id", order.product_id)
    .single();

  if (!product) {
    return { delivery: null, status: "files_unavailable" };
  }

  // 7. Get files (only active, non-expired)
  const { data: files } = await admin
    .from("files")
    .select("*")
    .eq("product_id", product.id)
    .eq("status", "uploaded")
    .or("expires_at.is.null,expires_at.gt.now()");

  const activeFiles = (files ?? []) as DeliveryFile[];

  if (activeFiles.length === 0) {
    return { delivery: null, status: "files_unavailable" };
  }

  return {
    delivery: {
      ...delivery,
      order,
      product,
      files: activeFiles,
    },
    status: "ready",
  };
}

/**
 * Generate a signed download URL for a specific file.
 * Validates the file belongs to the delivery's product.
 */
export async function generateFileDownloadUrl(
  token: string,
  fileId: string
): Promise<{ download_url: string | null; error?: string }> {
  const { delivery, status } = await resolveDeliveryToken(token);

  if (status !== "ready" || !delivery) {
    return { download_url: null, error: "Access denied" };
  }

  // Verify file belongs to this delivery's product
  const file = delivery.files.find((f) => f.id === fileId);
  if (!file) {
    return { download_url: null, error: "File not found" };
  }

  // Check file hasn't expired (retention)
  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    return { download_url: null, error: "File has expired" };
  }

  try {
    const { download_url } = await supabaseStorage.generateDownloadUrl(
      file.storage_key,
      { expires_in: SIGNED_URL_EXPIRY_SECONDS }
    );

    // Increment download count
    const admin = createAdminClient();
    await admin
      .from("deliveries")
      .update({
        download_count: delivery.download_count + 1,
      })
      .eq("id", delivery.id);

    await logAuditEvent("download_requested", "delivery", delivery.id, {
      file_id: fileId,
      filename: file.original_filename,
    });

    return { download_url };
  } catch (err) {
    return {
      download_url: null,
      error: err instanceof Error ? err.message : "Failed to generate download URL",
    };
  }
}

/**
 * Generate signed download URLs for all files in a delivery.
 */
export async function generateAllDownloadUrls(
  token: string
): Promise<{ urls: Array<{ file_id: string; filename: string; url: string }> | null; error?: string }> {
  const { delivery, status } = await resolveDeliveryToken(token);

  if (status !== "ready" || !delivery) {
    return { urls: null, error: "Access denied" };
  }

  const urls: Array<{ file_id: string; filename: string; url: string }> = [];

  for (const file of delivery.files) {
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      continue; // Skip expired files
    }

    try {
      const { download_url } = await supabaseStorage.generateDownloadUrl(
        file.storage_key,
        { expires_in: SIGNED_URL_EXPIRY_SECONDS }
      );

      urls.push({
        file_id: file.id,
        filename: file.original_filename,
        url: download_url,
      });
    } catch {
      // Skip files that fail to generate URLs
    }
  }

  if (urls.length === 0) {
    return { urls: null, error: "No downloadable files available" };
  }

  // Increment download count
  const admin = createAdminClient();
  await admin
    .from("deliveries")
    .update({
      download_count: delivery.download_count + 1,
    })
    .eq("id", delivery.id);

  await logAuditEvent("download_requested", "delivery", delivery.id, {
    file_count: urls.length,
    bulk: true,
  });

  return { urls };
}
