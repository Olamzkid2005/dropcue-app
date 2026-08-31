import { createHmac, timingSafeEqual } from "crypto";
import type {
  PaymentProvider,
  Money,
  WebhookVerificationResult,
  PaymentEvent,
} from "../types";

export class BachsProvider implements PaymentProvider {
  name = "bachs" as const;

  private getBaseUrl(): string {
    return (process.env.BACHS_SECRET_KEY ?? "").startsWith("sk_sandbox_")
      ? "https://sandbox-api.bachs.io"
      : "https://api.bachs.io";
  }

  formatAmount(money: Money): string {
    return (money.amount / 100).toFixed(2);
  }

  async createCheckoutSession(params: {
    orderId: string;
    amount: Money;
    product_name: string;
    buyer_email?: string;
    success_url: string;
    cancel_url: string;
  }): Promise<{ session_id: string; checkout_url: string }> {
    const secretKey = process.env.BACHS_SECRET_KEY;
    if (!secretKey) throw new Error("BACHS_SECRET_KEY not configured");

    const response = await fetch(`${this.getBaseUrl()}/v1/checkout-sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
        "Idempotency-Key": `checkout_${params.orderId}`,
      },
      body: JSON.stringify({
        pricing: {
          currency: params.amount.currency,
          amount: this.formatAmount(params.amount),
        },
        customer: {
          email: params.buyer_email ?? "anonymous@example.com",
        },
        success_url: params.success_url,
        cancel_url: params.cancel_url,
        reference: params.orderId,
        metadata: { order_id: params.orderId, product_name: params.product_name },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Bachs checkout failed: ${data.detail || data.error_code || response.statusText}`
      );
    }

    return { session_id: data.checkout_id, checkout_url: data.checkout_url };
  }

  async verifyWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<WebhookVerificationResult> {
    const webhookSecret = process.env.BACHS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return { valid: false, error: "BACHS_WEBHOOK_SECRET not configured" };
    }

    const signature = headers.get("x-bachs-signature");
    const timestamp = headers.get("x-bachs-timestamp");
    if (!signature || !timestamp) {
      return { valid: false, error: "Missing webhook signature headers" };
    }

    try {
      const timestampSeconds = Number(timestamp);
      if (
        !Number.isFinite(timestampSeconds) ||
        Math.abs(Date.now() / 1000 - timestampSeconds) > 300
      ) {
        return { valid: false, error: "Webhook timestamp too old" };
      }

      const expectedSignature = createHmac("sha256", webhookSecret)
        .update(`${timestamp}.${rawBody}`, "utf8")
        .digest("hex");
      const actual = Buffer.from(signature, "hex");
      const expected = Buffer.from(expectedSignature, "hex");

      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
        return { valid: false, error: "Invalid signature" };
      }

      return { valid: true, event: this.parseWebhook(rawBody) };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  parseWebhook(rawBody: string): PaymentEvent {
    const payload = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: {
        checkout_id?: string;
        amount?: string;
        currency?: string;
      };
    };
    const amountNaira = Number(payload.data?.amount ?? 0);

    return {
      type: payload.type === "collection.succeeded" ? "paid" : "failed",
      provider_event_id: payload.id ?? "",
      payment_reference: payload.data?.checkout_id ?? "",
      provider_session_id: payload.data?.checkout_id ?? "",
      amount: {
        amount: Math.round(amountNaira * 100),
        currency: payload.data?.currency || "NGN",
      },
    };
  }
}
