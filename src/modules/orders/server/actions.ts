"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generatePublicId } from "@/lib/security/tokens";
import { logAuditEvent } from "@/lib/audit";
import type { Order } from "../types";

const DELIVERY_TOKEN_EXPIRY_HOURS = 24;

export async function createOrder(params: {
  product_id: string;
  buyer_email: string;
  payment_provider: string;
  amount: number;
  currency: string;
}): Promise<{ order: Order | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: product, error: productError } = await admin
    .from("products")
    .select("id, status, price_amount, currency")
    .eq("id", params.product_id)
    .maybeSingle();

  if (productError) return { order: null, error: productError.message };
  if (!product) return { order: null, error: "Product not found" };
  if (product.status !== "published") {
    return { order: null, error: "Product is no longer available" };
  }

  if (
    product.price_amount !== params.amount ||
    product.currency !== params.currency
  ) {
    return { order: null, error: "Product price changed. Please try again" };
  }

  const { count, error: filesError } = await admin
    .from("files")
    .select("id", { count: "exact", head: true })
    .eq("product_id", params.product_id)
    .eq("status", "uploaded");

  if (filesError) return { order: null, error: filesError.message };
  if (!count) {
    return { order: null, error: "No files available for this product" };
  }

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      product_id: params.product_id,
      public_id: generatePublicId(),
      buyer_email: params.buyer_email,
      amount: product.price_amount,
      currency: product.currency,
      status: "pending",
      payment_provider: params.payment_provider,
    })
    .select()
    .single();

  return error
    ? { order: null, error: error.message }
    : { order, error: null };
}

/**
 * Atomically marks an order paid, creates its delivery, and records the
 * provider event. The email is sent only after this transaction succeeds.
 */
export async function fulfillOrder(params: {
  order_id: string;
  payment_reference: string;
  provider_session_id: string;
  provider_event_id: string;
  provider: string;
}): Promise<{ success: boolean; error: string | null }> {
  if (!params.provider_event_id) {
    return { success: false, error: "Missing provider event ID" };
  }

  const admin = createAdminClient();
  const expiresAt = new Date(
    Date.now() + DELIVERY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await admin.rpc("fulfill_order_atomic", {
    p_order_id: params.order_id,
    p_payment_reference: params.payment_reference,
    p_provider_session_id: params.provider_session_id,
    p_provider_event_id: params.provider_event_id,
    p_provider: params.provider,
    p_expires_at: expiresAt,
  });

  if (error) return { success: false, error: error.message };

  const fulfilled = Array.isArray(data) ? data[0] : data;
  if (!fulfilled) {
    // Duplicate webhook or an order already claimed by another webhook.
    return { success: true, error: null };
  }

  const deliveryToken = fulfilled.delivery_token as string;
  const buyerEmail = fulfilled.buyer_email as string;
  const productName = fulfilled.product_name as string;

  await logAuditEvent("payment_received", "order", params.order_id, {
    provider: params.provider,
  });

  try {
    const { sendPurchaseReadyEmail } = await import(
      "@/modules/notifications/server/actions"
    );
    await sendPurchaseReadyEmail({
      order_id: params.order_id,
      buyer_email: buyerEmail,
      product_name: productName,
      delivery_token: deliveryToken,
      expires_at: expiresAt,
      payment_reference: params.payment_reference,
    });
  } catch (emailError) {
    console.error("Failed to send purchase email:", emailError);
  }

  return { success: true, error: null };
}

export async function getOrderWithDelivery(
  orderId: string
): Promise<{ order: Order | null; delivery_token: string | null }> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*, deliveries(delivery_token)")
    .eq("id", orderId)
    .single();

  if (!order) return { order: null, delivery_token: null };

  return {
    order: order as unknown as Order,
    delivery_token:
      (order as { deliveries?: Array<{ delivery_token: string } | null> })
        .deliveries?.[0]?.delivery_token ?? null,
  };
}
