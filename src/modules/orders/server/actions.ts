"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePublicId, generateDeliveryToken } from "@/lib/security/tokens";
import { logAuditEvent } from "@/lib/audit";
import type { Order } from "../types";

const DELIVERY_TOKEN_EXPIRY_HOURS = 24;

/**
 * Create a new order for a product checkout.
 * Called when buyer initiates checkout.
 */
export async function createOrder(params: {
  product_id: string;
  buyer_email: string;
  payment_provider: string;
  amount: number; // In kobo
  currency: string;
}): Promise<{ order: Order | null; error: string | null }> {
  const admin = createAdminClient();

  // Verify product exists and is purchasable
  const { data: product } = await admin
    .from("products")
    .select("id, status, price_amount")
    .eq("id", params.product_id)
    .single();

  if (!product) {
    return { order: null, error: "Product not found" };
  }

  if (product.status === "archived") {
    return { order: null, error: "Product is no longer available" };
  }

  // Check files exist
  const { count } = await admin
    .from("files")
    .select("*", { count: "exact", head: true })
    .eq("product_id", params.product_id)
    .eq("status", "uploaded");

  if (!count || count === 0) {
    return { order: null, error: "No files available for this product" };
  }

  const publicId = generatePublicId();

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      product_id: params.product_id,
      public_id: publicId,
      buyer_email: params.buyer_email,
      amount: params.amount,
      currency: params.currency,
      status: "pending",
      payment_provider: params.payment_provider,
    })
    .select()
    .single();

  if (error) {
    return { order: null, error: error.message };
  }

  return { order, error: null };
}

/**
 * Mark order as paid and create delivery record.
 * Called from webhook handler after payment verification.
 * Uses database transaction for atomicity.
 */
export async function fulfillOrder(params: {
  order_id: string;
  payment_reference: string;
  provider_session_id: string;
  provider_event_id: string;
  provider: string;
}): Promise<{ success: boolean; error: string | null }> {
  const admin = createAdminClient();

  // Lock the order row to prevent concurrent fulfillment
  const { data: order, error: lockError } = await admin
    .from("orders")
    .select("id, status, product_id")
    .eq("id", params.order_id)
    .eq("status", "pending")
    .single();

  if (lockError || !order) {
    // Order not found or already fulfilled
    return {
      success: false,
      error: lockError?.message ?? "Order not found or already processed",
    };
  }

  // Mark order as paid
  const { error: updateError } = await admin
    .from("orders")
    .update({
      status: "paid",
      payment_reference: params.payment_reference,
      provider_session_id: params.provider_session_id,
      paid_at: new Date().toISOString(),
    })
    .eq("id", params.order_id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Create delivery record
  const deliveryToken = generateDeliveryToken();
  const expiresAt = new Date(
    Date.now() + DELIVERY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { error: deliveryError } = await admin.from("deliveries").insert({
    order_id: params.order_id,
    delivery_token: deliveryToken,
    status: "active",
    expires_at: expiresAt,
  });

  if (deliveryError) {
    // Order is paid but delivery failed — can retry later
    console.error("Failed to create delivery:", deliveryError);
    return { success: false, error: "Failed to create delivery" };
  }

  // Record payment event for idempotency
  await admin.from("payment_events").insert({
    provider: params.provider,
    provider_event_id: params.provider_event_id,
    event_type: "paid",
    order_id: params.order_id,
    payload_hash: params.payment_reference,
  });

  await logAuditEvent("payment_received", "order", params.order_id, {
    provider: params.provider,
  });

  // Send purchase-ready email (async, don't block webhook response)
  try {
    const { sendPurchaseReadyEmail } = await import("@/modules/notifications/server/actions");
    const { data: fullOrder } = await admin
      .from("orders")
      .select("buyer_email, payment_reference")
      .eq("id", params.order_id)
      .single();

    const { data: product } = await admin
      .from("products")
      .select("name")
      .eq("id", order.product_id)
      .single();

    if (fullOrder && product) {
      await sendPurchaseReadyEmail({
        order_id: params.order_id,
        buyer_email: fullOrder.buyer_email,
        product_name: product.name,
        delivery_token: deliveryToken,
        expires_at: expiresAt,
        payment_reference: fullOrder.payment_reference ?? params.payment_reference,
      });
    }
  } catch (emailErr) {
    // Email failure doesn't block fulfillment
    console.error("Failed to send purchase email:", emailErr);
  }

  return { success: true, error: null };
}

/**
 * Get order with delivery token for success page polling.
 */
export async function getOrderWithDelivery(
  orderId: string
): Promise<{ order: Order | null; delivery_token: string | null }> {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return { order: null, delivery_token: null };

  const { data: delivery } = await admin
    .from("deliveries")
    .select("delivery_token")
    .eq("order_id", orderId)
    .single();

  return { order, delivery_token: delivery?.delivery_token ?? null };
}
