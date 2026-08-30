import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BachsProvider } from "@/modules/payments/server/bachs";
import { fulfillOrder } from "@/modules/orders/server/actions";
import { logAuditEvent } from "@/lib/audit";

const bachs = new BachsProvider();

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    // Verify webhook signature
    const verification = await bachs.verifyWebhook(payload, request.headers);

    if (!verification.valid) {
      console.error("Bachs webhook verification failed:", verification.error);
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = verification.event;
    if (!event) {
      // Valid webhook but not a payment event we care about
      return Response.json({ received: true });
    }

    // Only process paid events
    if (event.type !== "paid") {
      return Response.json({ received: true });
    }

    const admin = createAdminClient();

    /* Idempotency check + order lookup are independent — run in parallel
       to halve webhook latency. */
    const [eventCheck, orderLookup] = await Promise.all([
      admin
        .from("payment_events")
        .select("id")
        .eq("provider", "bachs")
        .eq("provider_event_id", event.provider_event_id)
        .single(),
      admin
        .from("orders")
        .select("id, status, amount, currency")
        .or(`id.eq.${event.payment_reference},provider_session_id.eq.${event.payment_reference}`)
        .single(),
    ]);

    if (eventCheck.data) {
      // Already processed
      return Response.json({ received: true });
    }

    // Find order by provider_session_id (which we set as the Bachs checkout_id)
    const order = orderLookup.data;

    if (!order) {
      console.error("Order not found for payment reference:", event.payment_reference);
      return Response.json({ received: true });
    }

    // Verify amount matches
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

    // Fulfill the order (mark paid + create delivery)
    const result = await fulfillOrder({
      order_id: order.id,
      payment_reference: event.payment_reference,
      provider_session_id: event.payment_reference,
      provider_event_id: event.provider_event_id,
      provider: "bachs",
    });

    if (!result.success) {
      console.error("Order fulfillment failed:", result.error);
      // Still return 200 to prevent webhook retries for non-retryable errors
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Bachs webhook error:", error);
    // Return 200 to prevent endless retries for unexpected errors
    return Response.json({ received: true });
  }
}
