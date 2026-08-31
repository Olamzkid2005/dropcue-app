import Stripe from "stripe";
import type {
  PaymentProvider,
  Money,
  WebhookVerificationResult,
  PaymentEvent,
} from "../types";

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(secretKey);
}

export class StripeProvider implements PaymentProvider {
  name = "stripe" as const;

  formatAmount(money: Money): number {
    return money.amount;
  }

  async createCheckoutSession(params: {
    orderId: string;
    amount: Money;
    product_name: string;
    buyer_email?: string;
    success_url: string;
    cancel_url: string;
  }): Promise<{ session_id: string; checkout_url: string }> {
    const session = await getStripeClient().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: params.amount.currency.toLowerCase(),
            product_data: { name: params.product_name },
            unit_amount: this.formatAmount(params.amount),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      metadata: { order_id: params.orderId },
      ...(params.buyer_email && { customer_email: params.buyer_email }),
    });

    return { session_id: session.id, checkout_url: session.url ?? "" };
  }

  async verifyWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<WebhookVerificationResult> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = headers.get("stripe-signature");
    if (!webhookSecret || !signature) {
      return { valid: false, error: "Stripe webhook is not configured" };
    }

    try {
      const event = getStripeClient().webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );

      if (event.type !== "checkout.session.completed") return { valid: true };

      const session = event.data.object as Stripe.Checkout.Session;
      const paymentEvent: PaymentEvent = {
        type: "paid",
        provider_event_id: event.id,
        payment_reference:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.id,
        provider_session_id: session.id,
        amount: {
          amount: session.amount_total ?? 0,
          currency: (session.currency ?? "ngn").toUpperCase(),
        },
      };
      return { valid: true, event: paymentEvent };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }
}
