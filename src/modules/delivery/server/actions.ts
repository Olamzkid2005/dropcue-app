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

  const { data: delivery, error: deliveryError } = await admin
    .from("deliveries")
    .select("*")
    .eq("delivery_token", token)
    .single();

  if (deliveryError || !delivery) {
    return { delivery: null, status: "invalid", error: "Invalid download link" };
  }

  if (new Date(delivery.expires_at) < new Date()) {
    await admin
      .from("deliveries")
      .update({ status: "expired" })
      .eq("id", delivery.id);

    return { delivery: null, status: "expired" };
  }

  if (delivery.status === "revoked") {
    return {
      delivery: null,
      status: "expired",
      error: "Download link has been revoked",
    };
  }

  if (delivery.download_count >= delivery.max_downloads) {
    return {
      delivery: null,
      status: "expired",
      error: "Download limit reached",
    };
  }

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

  const activeFiles = ((product.files ?? []) as DeliveryFile[]).filter(
    (file) =>
      file.status === "uploaded" &&
      (!file.expires_at || new Date(file.expires_at) > new Date())
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

async function reserveDownload(deliveryId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("increment_delivery_downloads", {
    p_delivery_id: deliveryId,
  });

  return !error && typeof data === "number" && data > 0;
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

  const file = delivery.files.find((candidate) => candidate.id === fileId);
  if (!file) {
    return { download_url: null, error: "File not found" };
  }

  if (!file.expires_at || new Date(file.expires_at) > new Date()) {
    if (!(await reserveDownload(delivery.id))) {
      return { download_url: null, error: "Download limit reached" };
    }
  } else {
    return { download_url: null, error: "File has expired" };
  }

  try {
    const { download_url } = await supabaseStorage.generateDownloadUrl(
      file.storage_key,
      { expires_in: SIGNED_URL_EXPIRY_SECONDS }
    );

    await logAuditEvent("download_requested", "delivery", delivery.id, {
      file_id: fileId,
      filename: file.original_filename,
    });

    return { download_url };
  } catch (err) {
    return {
      download_url: null,
      error:
        err instanceof Error ? err.message : "Failed to generate download URL",
    };
  }
}

/**
 * Generate signed download URLs for all files in a delivery.
 */
export async function generateAllDownloadUrls(
  token: string
): Promise<{
  urls: Array<{ file_id: string; filename: string; url: string }> | null;
  error?: string;
}> {
  const { delivery, status } = await resolveDeliveryToken(token);

  if (status !== "ready" || !delivery) {
    return { urls: null, error: "Access denied" };
  }

  const candidates = delivery.files.filter(
    (file) => !file.expires_at || new Date(file.expires_at) > new Date()
  );
  if (!(await reserveDownload(delivery.id))) {
    return { urls: null, error: "Download limit reached" };
  }

  const results = await Promise.all(
    candidates.map(async (file) => {
      try {
        const { download_url } = await supabaseStorage.generateDownloadUrl(
          file.storage_key,
          { expires_in: SIGNED_URL_EXPIRY_SECONDS }
        );
        return {
          file_id: file.id,
          filename: file.original_filename,
          url: download_url,
        };
      } catch {
        return null;
      }
    })
  );

  const urls = results.filter(
    (url): url is { file_id: string; filename: string; url: string } =>
      url !== null
  );

  if (urls.length === 0) {
    return { urls: null, error: "No downloadable files available" };
  }

  await logAuditEvent("download_requested", "delivery", delivery.id, {
    file_count: urls.length,
    bulk: true,
  });

  return { urls };
}
