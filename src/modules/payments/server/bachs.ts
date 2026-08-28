import { createHmac, timingSafeEqual } from "crypto";
import type {
  PaymentProvider,
  Money,
  WebhookVerificationResult,
  VerifiedTransaction,
  PaymentEvent,
} from "../types";

/**
 * Bachs.io payment adapter.
 *
 * Key differences from Korapay:
 * - Money format: decimal strings (e.g., "15000.00"), never minor units
 * - Webhook event: collection.succeeded
 * - Webhook verification: HMAC-SHA256 of "{timestamp}.{raw_body}"
 * - Built-in idempotency via Idempotency-Key header
 * - Base URLs: sandbox-api.bachs.io / api.bachs.io
 *
 * @see https://docs.bachs.io
 */
export class BachsProvider implements PaymentProvider {
  name = "bachs" as const;

  private getBaseUrl(): string {
    const apiKey = process.env.BACHS_SECRET_KEY ?? "";
    // sandbox keys start with sk_sandbox_, production with sk_live_
    return apiKey.startsWith("sk_sandbox_")
      ? "https://sandbox-api.bachs.io"
      : "https://api.bachs.io";
  }

  /**
   * Bachs uses decimal strings at currency precision (e.g., "15000.00" for NGN).
   * Internal amount is in kobo, so divide by 100.
   */
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
    webhook_url: string;
  }): Promise<{ session_id: string; checkout_url: string }> {
    const secretKey = process.env.BACHS_SECRET_KEY;
    if (!secretKey) throw new Error("BACHS_SECRET_KEY not configured");

    const baseUrl = this.getBaseUrl();

    const response = await fetch(`${baseUrl}/v1/checkout-sessions`, {
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
        metadata: {
          order_id: params.orderId,
          product_name: params.product_name,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Bachs checkout failed: ${data.detail || data.error_code || response.statusText}`
      );
    }

    return {
      session_id: data.checkout_id,
      checkout_url: data.checkout_url,
    };
  }

  async verifyWebhook(
    payload: unknown,
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
      // Reject stale deliveries (5 minute tolerance)
      const ts = parseInt(timestamp, 10);
      if (Math.abs(Date.now() / 1000 - ts) > 300) {
        return { valid: false, error: "Webhook timestamp too old" };
      }

      // Reconstruct the signed message: "{timestamp}.{raw_body}"
      const rawBody = JSON.stringify(payload);
      const message = `${timestamp}.${rawBody}`;

      const expectedSignature = createHmac("sha256", webhookSecret)
        .update(message, "utf8")
        .digest("hex");

      // Timing-safe comparison
      const sigBuffer = Buffer.from(signature, "hex");
      const expectedBuffer = Buffer.from(expectedSignature, "hex");

      if (sigBuffer.length !== expectedBuffer.length ||
          !timingSafeEqual(sigBuffer, expectedBuffer)) {
        return { valid: false, error: "Invalid signature" };
      }

      const event = this.parseWebhook(payload);
      return { valid: true, event };
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
    const secretKey = process.env.BACHS_SECRET_KEY;
    if (!secretKey) throw new Error("BACHS_SECRET_KEY not configured");

    const baseUrl = this.getBaseUrl();

    const response = await fetch(
      `${baseUrl}/v1/checkout-sessions/${paymentReference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Bachs verification failed: ${data.detail || response.statusText}`
      );
    }

    // Parse the amount from decimal string back to kobo
    const amountNaira = parseFloat(data.amount ?? "0");

    return {
      status: data.status === "completed" ? "success" : data.status === "expired" ? "failed" : "pending",
      amount: {
        amount: Math.round(amountNaira * 100),
        currency: data.currency || "NGN",
      },
      currency: data.currency || "NGN",
      reference: data.reference ?? paymentReference,
    };
  }

  parseWebhook(payload: unknown): PaymentEvent {
    const data = payload as {
      id?: string;
      type?: string;
      data?: {
        charge_id?: string;
        checkout_id?: string;
        status?: string;
        amount?: string;
        currency?: string;
      };
    };

    // collection.succeeded → paid, collection.failed → failed
    const eventType =
      data.type === "collection.succeeded" ? "paid" : "failed";

    // Amount comes as decimal string, convert to kobo
    const amountNaira = parseFloat(data.data?.amount ?? "0");

    return {
      type: eventType,
      provider_event_id: data.id ?? "",
      payment_reference: data.data?.checkout_id ?? "",
      amount: {
        amount: Math.round(amountNaira * 100),
        currency: data.data?.currency || "NGN",
      },
    };
  }
}
