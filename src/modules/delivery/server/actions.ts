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

  // 5. Fetch order + product + files in ONE round-trip (nested embed)
  const { data: order } = await admin
    .from("orders")
    .select("*, products(*, files(*))")
    .eq("id", delivery.order_id)
    .single();

  if (!order || order.status !== "paid") {
    return { delivery: null, status: "processing" };
  }

  const product = order.products as
    | {
        id: string;
        name: string;
        description: string | null;
        creator_id: string;
        files: DeliveryFile[] | null;
      }
    | null;

  if (!product) {
    return { delivery: null, status: "files_unavailable" };
  }

  // Filter active files client-side (same semantics as the old SQL filter:
  // status = 'uploaded' AND (expires_at IS NULL OR expires_at > now))
  const allFiles = (product.files ?? []) as DeliveryFile[];
  const activeFiles = allFiles.filter(
    (f) =>
      f.status === "uploaded" &&
      (!f.expires_at || new Date(f.expires_at) > new Date())
  );

  if (activeFiles.length === 0) {
    return { delivery: null, status: "files_unavailable" };
  }

  return {
    delivery: {
      ...delivery,
      order,
      product: {
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        creator_id: product.creator_id,
      },
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

    // Atomic increment — SQL-side, guarded by max_downloads (replaces the
    // read-modify-write pattern that loses counts under concurrent downloads)
    const admin = createAdminClient();
    await admin.rpc("increment_delivery_downloads", {
      p_delivery_id: delivery.id,
    });

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

  // Sign all URLs in parallel (N sequential storage round-trips → 1 batch)
  const candidates = delivery.files.filter(
    (f) => !f.expires_at || new Date(f.expires_at) > new Date()
  );

  const results = await Promise.all(
    candidates.map(async (file) => {
      try {
        const { download_url } = await supabaseStorage.generateDownloadUrl(
          file.storage_key,
          { expires_in: SIGNED_URL_EXPIRY_SECONDS }
        );
        return { file_id: file.id, filename: file.original_filename, url: download_url };
      } catch {
        return null; // Skip files that fail to generate URLs
      }
    })
  );

  const urls: Array<{ file_id: string; filename: string; url: string }> = results.filter(
    (u): u is { file_id: string; filename: string; url: string } => u !== null
  );

  if (urls.length === 0) {
    return { urls: null, error: "No downloadable files available" };
  }

  // Atomic increment — SQL-side, guarded by max_downloads (replaces the
  // read-modify-write pattern that loses counts under concurrent downloads)
  const admin = createAdminClient();
  await admin.rpc("increment_delivery_downloads", {
    p_delivery_id: delivery.id,
  });

  await logAuditEvent("download_requested", "delivery", delivery.id, {
    file_count: urls.length,
    bulk: true,
  });

  return { urls };
}
