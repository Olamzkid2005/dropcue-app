import { createHmac, timingSafeEqual } from "crypto";
import type {
  PaymentProvider,
  Money,
  WebhookVerificationResult,
  PaymentEvent,
} from "../types";

/**
 * Bachs payment provider.
 *
 * Marketplace model: Bachs Connect DIRECT charges. Each sale is created
 * with X-Account-Id (the creator's Bachs account) so it lands in the
 * creator's own balance, with `platform_fee` split back to the platform.
 * The platform never holds creator funds.
 *
 * Docs shape (verified against docs.bachs.io):
 * - Money is a decimal string at currency precision ("250.00"), never minor units.
 * - Transfers (platform -> account): POST /v1/transfers with destination
 *   account id; debits platform available balance; instant; idempotent via
 *   the Idempotency-Key header; requires transfers:write + connect active.
 * - Platform fees are NOT auto-reversed on refund; we return the fee
 *   voluntarily with a transfer when a full refund settles.
 */
export class BachsProvider implements PaymentProvider {
  name = "bachs" as const;

  private getBaseUrl(): string {
    return (process.env.BACHS_SECRET_KEY ?? "").startsWith("sk_sandbox_")
      ? "https://sandbox-api.bachs.io"
      : "https://api.bachs.io";
  }

  private getSecretKey(): string {
    const key = process.env.BACHS_SECRET_KEY;
    if (!key) throw new Error("BACHS_SECRET_KEY not configured");
    return key;
  }

  /** Kobo -> Bachs decimal-string naira, e.g. 25000 -> "250.00". */
  formatAmount(money: Money): string {
    return (money.amount / 100).toFixed(2);
  }

  private async api(
    path: string,
    init: {
      method?: string;
      body?: unknown;
      idempotencyKey?: string;
      accountId?: string;
    } = {}
  ): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.getSecretKey()}`,
    };
    if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;
    if (init.accountId) headers["X-Account-Id"] = init.accountId;

    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      method: init.method ?? "POST",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const detail =
        data.detail || data.error_code || data.error || response.statusText;
      throw new Error(`Bachs API failed: ${detail}`);
    }
    return data;
  }

  /* ──────────────────────────────────────────────
     Checkout (direct charge with platform fee)
     ────────────────────────────────────────────── */

  async createCheckoutSession(params: {
    orderId: string;
    amount: Money;
    product_name: string;
    buyer_email?: string;
    success_url: string;
    cancel_url: string;
    /** Creator's Bachs account — presence makes this a direct charge. */
    connectedAccountId?: string;
    /** Platform cut, decimal-string naira ("250.00"). */
    platformFee?: string;
  }): Promise<{ session_id: string; checkout_url: string }> {
    const body: Record<string, unknown> = {
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
    };
    if (params.platformFee !== undefined) body.platform_fee = params.platformFee;

    const data = await this.api("/v1/checkout-sessions", {
      body,
      idempotencyKey: `checkout_${params.orderId}`,
      accountId: params.connectedAccountId,
    });

    return {
      session_id: String(data.checkout_id ?? ""),
      checkout_url: String(data.checkout_url ?? ""),
    };
  }

  /* ──────────────────────────────────────────────
     Connect: creator accounts
     ────────────────────────────────────────────── */

  /** Create the creator's Bachs account (their "till"). */
  async createConnectedAccount(params: {
    email: string;
    displayName: string;
  }): Promise<{ accountId: string }> {
    const data = await this.api("/v1/accounts", {
      body: {
        contact_email: params.email,
        display_name: params.displayName,
        country: "NG",
        entity_type: "individual",
        configuration: {
          merchant: {
            capabilities: {
              card_collection: { requested: true },
              ngn_card_collection: { requested: true },
            },
          },
          recipient: {
            capabilities: {
              payouts: { requested: true },
              transfers: { requested: true },
            },
          },
        },
      },
    });
    return { accountId: String(data.id ?? "") };
  }

  /** Hosted onboarding link. Create at the moment of redirect only —
      issuing a new link invalidates any outstanding one of the same type. */
  async createOnboardingLink(params: {
    accountId: string;
    refresh_url: string;
    return_url: string;
  }): Promise<{ url: string }> {
    const data = await this.api(
      `/v1/accounts/${params.accountId}/account-links`,
      {
        body: {
          type: "onboarding",
          refresh_url: params.refresh_url,
          return_url: params.return_url,
        },
      }
    );
    return { url: String(data.url ?? "") };
  }

  /** Live capability statuses for an account. */
  async getAccountCapabilities(accountId: string): Promise<
    Array<{ name: string; status: string }>
  > {
    const data = await this.api(`/v1/accounts/${accountId}/capabilities`, {
      method: "GET",
    });
    const items = (data.items ?? []) as Array<{ name?: string; status?: string }>;
    return items.map((i) => ({
      name: String(i.name ?? ""),
      status: String(i.status ?? ""),
    }));
  }

  /** True when the account can accept card payments (checkout may proceed). */
  canAcceptPayments(caps: Array<{ name: string; status: string }>): boolean {
    return caps.some(
      (c) =>
        (c.name === "card_collection" || c.name === "ngn_card_collection") &&
        c.status === "active"
    );
  }

  /** Platform -> creator transfer. Used to return our fee on a full refund.
      Instant; safe to retry with the same idempotency key. */
  async returnPlatformFee(params: {
    accountId: string;
    /** Fee amount, decimal-string naira ("250.00"). */
    amount: string;
    currency: string;
    /** Groups the recovery with the original charge. */
    chargeId: string;
    idempotencyKey: string;
  }): Promise<{ transferId: string; status: string }> {
    const data = await this.api("/v1/transfers", {
      body: {
        destination: params.accountId,
        amount: params.amount,
        currency: params.currency,
        transfer_group: params.chargeId,
      },
      idempotencyKey: params.idempotencyKey,
    });
    return {
      transferId: String(data.id ?? ""),
      status: String(data.status ?? "pending"),
    };
  }

  /* ──────────────────────────────────────────────
     Webhooks
     ────────────────────────────────────────────── */

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

  /**
   * Maps the Bachs events we care about:
   * - collection.succeeded        -> paid      (platform-level checkout)
   * - checkout.completed          -> paid      (Connect direct charge)
   * - refund.paid                 -> refunded  (fee return is triggered by caller)
   * Everything else maps to "failed"/ignored by the caller.
   */
  parseWebhook(rawBody: string): PaymentEvent {
    const payload = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: {
        checkout_id?: string;
        amount?: string;
        currency?: string;
        payment_status?: string;
        status?: string;
        charge?: { id?: string; amount?: string; currency?: string };
        charge_id?: string;
        refunded_amount?: string;
        requested_amount?: string;
      };
    };

    const toKobo = (naira?: string) => Math.round(Number(naira ?? 0) * 100);

    // Connect direct charge: sale complete.
    if (payload.type === "checkout.completed") {
      const chargeId = payload.data?.charge?.id;
      return {
        type: payload.data?.payment_status === "paid" ? "paid" : "failed",
        provider_event_id: payload.id ?? "",
        payment_reference: payload.data?.checkout_id ?? "",
        provider_session_id: payload.data?.checkout_id ?? "",
        charge_id: chargeId,
        amount: {
          amount: toKobo(payload.data?.charge?.amount ?? payload.data?.amount),
          currency: payload.data?.charge?.currency || payload.data?.currency || "NGN",
        },
      };
    }

    // Refund settled (refund.paid / refund.failed / refund.created).
    if (payload.type?.startsWith("refund.")) {
      return {
        type: "refunded",
        provider_event_id: payload.id ?? "",
        payment_reference: payload.data?.charge_id ?? "",
        charge_id: payload.data?.charge_id,
        refunded_amount: toKobo(
          payload.data?.refunded_amount ?? payload.data?.requested_amount
        ),
        amount: {
          amount: toKobo(payload.data?.requested_amount ?? payload.data?.refunded_amount),
          currency: "NGN",
        },
      };
    }

    // Platform-level legacy event.
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
