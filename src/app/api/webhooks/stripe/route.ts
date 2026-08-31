import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StripeProvider } from "@/modules/payments/server/stripe";
import { fulfillOrder } from "@/modules/orders/server/actions";
import { logAuditEvent } from "@/lib/audit";

const stripeProvider = new StripeProvider();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const verification = await stripeProvider.verifyWebhook(rawBody, request.headers);

    if (!verification.valid) {
      console.error("Stripe webhook verification failed:", verification.error);
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = verification.event;
    if (!event) return Response.json({ received: true });

    const admin = createAdminClient();
    const [eventCheck, orderLookup] = await Promise.all([
      admin
        .from("payment_events")
        .select("id")
        .eq("provider", "stripe")
        .eq("provider_event_id", event.provider_event_id)
        .maybeSingle(),
      admin
        .from("orders")
        .select("id, amount, currency, provider_session_id")
        .eq(
          "provider_session_id",
          event.provider_session_id ?? event.payment_reference
        )
        .maybeSingle(),
    ]);

    if (eventCheck.data) return Response.json({ received: true });

    const order = orderLookup.data;
    if (!order) {
      console.error("Order not found for session:", event.payment_reference);
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
      provider: "stripe",
    });

    if (!result.success) {
      console.error("Order fulfillment failed:", result.error);
      return Response.json({ error: "Webhook processing failed" }, { status: 500 });
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
