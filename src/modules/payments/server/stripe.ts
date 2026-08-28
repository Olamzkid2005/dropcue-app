import Stripe from "stripe";
import type {
  PaymentProvider,
  Money,
  WebhookVerificationResult,
  VerifiedTransaction,
  PaymentEvent,
} from "../types";

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(secretKey);
}

export class StripeProvider implements PaymentProvider {
  name = "stripe" as const;

  /**
   * Stripe uses smallest currency unit (kobo) - pass through as-is
   */
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
    webhook_url: string;
  }): Promise<{ session_id: string; checkout_url: string }> {
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: params.amount.currency.toLowerCase(),
            product_data: {
              name: params.product_name,
            },
            unit_amount: this.formatAmount(params.amount),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      metadata: {
        order_id: params.orderId,
      },
      ...(params.buyer_email && { customer_email: params.buyer_email }),
    });

    return {
      session_id: session.id,
      checkout_url: session.url ?? "",
    };
  }

  async verifyWebhook(
    payload: unknown,
    headers: Headers
  ): Promise<WebhookVerificationResult> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return { valid: false, error: "STRIPE_WEBHOOK_SECRET not configured" };
    }

    const signature = headers.get("stripe-signature");
    if (!signature) {
      return { valid: false, error: "Missing webhook signature" };
    }

    try {
      const stripe = getStripeClient();
      const event = stripe.webhooks.constructEvent(
        payload as string | Buffer,
        signature,
        webhookSecret
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentEvent: PaymentEvent = {
          type: "paid",
          provider_event_id: event.id,
          payment_reference: session.payment_intent as string ?? session.id,
          amount: {
            amount: session.amount_total ?? 0,
            currency: (session.currency ?? "ngn").toUpperCase(),
          },
        };
        return { valid: true, event: paymentEvent };
      }

      // Other event types - still valid, just not a payment success
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : "Verification failed",
      };
    }
  }

  async verifyTransaction(
    paymentReference: string
  ): Promise<VerifiedTransaction> {
    const stripe = getStripeClient();

    // Try as checkout session first, then as payment intent
    try {
      const session = await stripe.checkout.sessions.retrieve(paymentReference);
      return {
        status:
          session.payment_status === "paid" ? "success" : "pending",
        amount: {
          amount: session.amount_total ?? 0,
          currency: (session.currency ?? "ngn").toUpperCase(),
        },
        currency: (session.currency ?? "ngn").toUpperCase(),
        reference: session.id,
      };
    } catch {
      // Not a session ID, try as payment intent
      const intent = await stripe.paymentIntents.retrieve(paymentReference);
      return {
        status:
          intent.status === "succeeded" ? "success" : intent.status === "failed" ? "failed" : "pending",
        amount: {
          amount: intent.amount,
          currency: intent.currency.toUpperCase(),
        },
        currency: intent.currency.toUpperCase(),
        reference: intent.id,
      };
    }
  }

  parseWebhook(payload: unknown): PaymentEvent {
    const event = payload as {
      id?: string;
      type?: string;
      data?: {
        object?: {
          id?: string;
          amount_total?: number;
          currency?: string;
          payment_intent?: string;
          metadata?: { order_id?: string };
          payment_status?: string;
        };
      };
    };

    const session = event.data?.object;
    const eventType =
      event.type === "checkout.session.completed" ? "paid" : "failed";

    return {
      type: eventType,
      provider_event_id: event.id ?? "",
      payment_reference:
        (session?.payment_intent as string) ?? session?.id ?? "",
      amount: {
        amount: session?.amount_total ?? 0,
        currency: (session?.currency ?? "ngn").toUpperCase(),
      },
    };
  }
}
