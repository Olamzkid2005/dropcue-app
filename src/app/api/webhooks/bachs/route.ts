import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BachsProvider } from "@/modules/payments/server/bachs";
import { getBachsProvider } from "@/modules/payments/server/connect";
import { fulfillOrder } from "@/modules/orders/server/actions";
import { logAuditEvent } from "@/lib/audit";

const bachs = new BachsProvider();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const verification = await bachs.verifyWebhook(rawBody, request.headers);

    if (!verification.valid) {
      console.error("Bachs webhook verification failed:", verification.error);
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = verification.event;
    if (!event) {
      return Response.json({ received: true });
    }

    if (event.type === "refunded") {
      return handleRefundEvent(event);
    }

    if (event.type !== "paid") {
      return Response.json({ received: true });
    }

    const admin = createAdminClient();
    const [eventCheck, orderLookup] = await Promise.all([
      admin
        .from("payment_events")
        .select("id")
        .eq("provider", "bachs")
        .eq("provider_event_id", event.provider_event_id)
        .maybeSingle(),
      admin
        .from("orders")
        .select("id, amount, currency")
        .eq(
          "provider_session_id",
          event.provider_session_id ?? event.payment_reference
        )
        .maybeSingle(),
    ]);

    if (eventCheck.data) return Response.json({ received: true });

    const order = orderLookup.data;
    if (!order) {
      console.error("Order not found for payment reference:", event.payment_reference);
      return Response.json({ received: true });
    }

    if (order.amount !== event.amount.amount || order.currency !== event.amount.currency) {
      await logAuditEvent("payment_received", "order", order.id, {
        error: "amount_or_currency_mismatch",
        expected: { amount: order.amount, currency: order.currency },
        received: { amount: event.amount.amount, currency: event.amount.currency },
      });
      return Response.json({ received: true });
    }

    const result = await fulfillOrder({
      order_id: order.id,
      payment_reference: event.payment_reference,
      provider_session_id: event.provider_session_id ?? event.payment_reference,
      provider_event_id: event.provider_event_id,
      provider: "bachs",
    });

    if (!result.success) {
      console.error("Order fulfillment failed:", result.error);
      return Response.json({ error: "Webhook processing failed" }, { status: 500 });
    }

    // Remember the charge id so later refunds (refund.paid carries only
    // charge_id) can be tied back to this order. Best effort — fulfillment
    // must not be rolled back if this write fails.
    if (event.charge_id) {
      const { error: chargeError } = await admin
        .from("orders")
        .update({ provider_charge_id: event.charge_id })
        .eq("id", order.id);
      if (chargeError) {
        console.error("Failed to store charge id:", chargeError.message);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Bachs webhook error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/**
 * Full refund settled → voluntarily return our platform fee to the creator
 * (product decision: creators keep their net even on refunds). Bachs does
 * NOT reverse platform fees itself.
 *
 * Retry semantics: any transfer failure returns 500 so Bachs redelivers the
 * event. The transfer uses Idempotency-Key `feereturn_<event id>`, so
 * redelivery can never pay the fee back twice. Partial refunds keep the fee.
 */
async function handleRefundEvent(event: NonNullable<
  Awaited<ReturnType<typeof bachs.verifyWebhook>>["event"]
>): Promise<Response> {
  const admin = createAdminClient();

  if (!event.charge_id) return Response.json({ received: true });

  const { data: order } = await admin
    .from("orders")
    .select("id, amount, platform_fee_amount, bachs_account_id, product_id")
    .eq("provider_charge_id", event.charge_id)
    .maybeSingle();

  if (!order) {
    // Refunds for charges that Dropcue does not know are harmless.
    return Response.json({ received: true });
  }

  // Refund fixtures and older orders may not have Connect attribution. Resolve
  // the creator account through the product owner when possible.
  let bachsAccountId = order.bachs_account_id;
  if (!bachsAccountId && order.product_id) {
    const { data: creator } = await admin
      .from("products")
      .select("creators(bachs_account_id)")
      .eq("id", order.product_id)
      .maybeSingle();
    const creatorData = creator?.creators as
      | { bachs_account_id?: string | null }
      | Array<{ bachs_account_id?: string | null }>
      | null;
    bachsAccountId = Array.isArray(creatorData)
      ? creatorData[0]?.bachs_account_id ?? null
      : creatorData?.bachs_account_id ?? null;
  }

  if (!order.platform_fee_amount) {
    return Response.json({ received: true });
  }

  // The unique provider_event_id constraint makes this insert the atomic
  // refund claim. A completed duplicate is safe to acknowledge; a duplicate
  // that is still processing must stay retryable in case the first request
  // crashed before finishing the transfer.
  const { error: claimError } = await admin.from("payment_events").insert({
    provider: "bachs",
    provider_event_id: event.provider_event_id,
    event_type: "refund.processing",
    order_id: order.id,
    payload_hash: event.charge_id,
  });
  if (claimError) {
    if (claimError.code !== "23505") throw claimError;
    const { data: existing } = await admin
      .from("payment_events")
      .select("event_type")
      .eq("provider", "bachs")
      .eq("provider_event_id", event.provider_event_id)
      .maybeSingle();
    if (existing?.event_type === "refund.processing") {
      return Response.json({ error: "Webhook still processing" }, { status: 500 });
    }
    return Response.json({ received: true });
  }

  const isFullRefund = (event.refunded_amount ?? 0) >= order.amount;

  if (!isFullRefund) {
    await logAuditEvent("refund_fee_kept", "order", order.id, {
      reason: "partial_refund",
      refunded_amount: event.refunded_amount ?? 0,
      order_amount: order.amount,
    });
    const { error: recordError } = await admin
      .from("payment_events")
      .update({
        event_type: "refund.fee_kept",
        payload_hash: `partial:${event.refunded_amount ?? 0}`,
      })
      .eq("provider", "bachs")
      .eq("provider_event_id", event.provider_event_id);
    if (recordError) {
      await admin
        .from("payment_events")
        .delete()
        .eq("provider", "bachs")
        .eq("provider_event_id", event.provider_event_id);
      throw recordError;
    }
    return Response.json({ received: true });
  }

  if (!bachsAccountId) {
    await admin
      .from("payment_events")
      .update({ event_type: "refund.no_account" })
      .eq("provider", "bachs")
      .eq("provider_event_id", event.provider_event_id);
    return Response.json({ received: true });
  }
  try {
    const provider = getBachsProvider();
    const { transferId, status } = await provider.returnPlatformFee({
      accountId: bachsAccountId,
      amount: (order.platform_fee_amount / 100).toFixed(2),
      currency: "NGN",
      chargeId: event.charge_id,
      idempotencyKey: `feereturn_${event.provider_event_id}`,
    });

    const { error: recordError } = await admin
      .from("payment_events")
      .update({
        event_type: "refund.fee_returned",
        payload_hash: transferId,
      })
      .eq("provider", "bachs")
      .eq("provider_event_id", event.provider_event_id);
    if (recordError) throw recordError;

    await logAuditEvent("refund_fee_returned", "order", order.id, {
      transfer_id: transferId,
      transfer_status: status,
      fee_amount: order.platform_fee_amount,
      bachs_account_id: bachsAccountId,
    });

    return Response.json({ received: true });
  } catch (error) {
    // Release only the processing claim. Bachs redelivery retries the transfer;
    // the same Idempotency-Key prevents a duplicate payout if the provider
    // completed the transfer before this request observed the failure.
    await admin
      .from("payment_events")
      .delete()
      .eq("provider", "bachs")
      .eq("provider_event_id", event.provider_event_id)
      .eq("event_type", "refund.processing");
    console.error("Platform fee return failed:", error);
    await logAuditEvent("refund_fee_return_failed", "order", order.id, {
      provider_event_id: event.provider_event_id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
