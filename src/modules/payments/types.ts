export interface Money {
  amount: number; // Smallest currency unit (kobo for NGN)
  currency: string; // ISO 4217
}

export interface PaymentProvider {
  name: string;

  /**
   * Convert our internal Money format to the provider's expected amount.
   * Stripe: uses smallest unit (kobo) - pass through as-is
   * Korapay: uses whole units (e.g., 5000 for ₦5,000) - divide by 100
   */
  formatAmount(money: Money): number | string;

  createCheckoutSession(params: {
    orderId: string;
    amount: Money;
    product_name: string;
    buyer_email?: string;
    success_url: string;
    cancel_url: string;
    webhook_url: string;
  }): Promise<{
    session_id: string;
    checkout_url: string;
  }>;

  verifyWebhook(
    payload: unknown,
    headers: Headers
  ): Promise<WebhookVerificationResult>;

  /**
   * Verify transaction directly with provider.
   * Required for Korapay (Charge Query API).
   * Optional for Stripe (webhook signature sufficient).
   */
  verifyTransaction(
    paymentReference: string
  ): Promise<VerifiedTransaction>;

  /**
   * Parse webhook payload into standardized payment event.
   */
  parseWebhook(payload: unknown): PaymentEvent;
}

export interface WebhookVerificationResult {
  valid: boolean;
  event?: PaymentEvent;
  error?: string;
}

export interface VerifiedTransaction {
  status: "success" | "failed" | "pending";
  amount: Money;
  currency: string;
  reference: string;
}

export interface PaymentEvent {
  type: "paid" | "failed" | "refunded";
  provider_event_id: string;
  payment_reference: string;
  amount: Money;
}

export type PaymentProviderName = "stripe" | "bachs";
