import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StripeProvider } from "@/modules/payments/server/stripe";
import { fulfillOrder } from "@/modules/orders/server/actions";
import { logAuditEvent } from "@/lib/audit";

const stripeProvider = new StripeProvider();

export async function POST(request: NextRequest) {
  try {
    // Stripe requires the raw body for signature verification
    const rawBody = await request.text();
    const headers = request.headers;

    // Verify webhook signature
    const verification = await stripeProvider.verifyWebhook(rawBody, headers);

    if (!verification.valid) {
      console.error("Stripe webhook verification failed:", verification.error);
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = verification.event;
    if (!event) {
      // Valid webhook but not a payment success
      return Response.json({ received: true });
    }

    const admin = createAdminClient();

    /* Idempotency check + order lookup are independent — run in parallel
       to halve webhook latency. */
    const [eventCheck, orderLookup] = await Promise.all([
      admin
        .from("payment_events")
        .select("id")
        .eq("provider", "stripe")
        .eq("provider_event_id", event.provider_event_id)
        .single(),
      admin
        .from("orders")
        .select("id, status, amount, currency")
        .eq("provider_session_id", event.payment_reference)
        .single(),
    ]);

    if (eventCheck.data) {
      return Response.json({ received: true });
    }

    // Find order by provider_session_id
    const order = orderLookup.data;

    if (!order) {
      console.error("Order not found for session:", event.payment_reference);
      return Response.json({ received: true });
    }

    // Verify amount
    if (order.amount !== event.amount.amount) {
      console.error("Amount mismatch:", {
        order_amount: order.amount,
        event_amount: event.amount.amount,
      });
      await logAuditEvent("payment_received", "order", order.id, {
        error: "amount_mismatch",
        expected: order.amount,
        received: event.amount.amount,
      });
      return Response.json({ received: true });
    }

    // Fulfill the order
    const result = await fulfillOrder({
      order_id: order.id,
      payment_reference: event.payment_reference,
      provider_session_id: event.payment_reference,
      provider_event_id: event.provider_event_id,
      provider: "stripe",
    });

    if (!result.success) {
      console.error("Order fulfillment failed:", result.error);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return Response.json({ received: true });
  }
}
