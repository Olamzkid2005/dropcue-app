export interface Money {
  amount: number;
  currency: string;
}

export interface PaymentProvider {
  name: PaymentProviderName;

  formatAmount(money: Money): number | string;

  createCheckoutSession(params: {
    orderId: string;
    amount: Money;
    product_name: string;
    buyer_email?: string;
    success_url: string;
    cancel_url: string;
  }): Promise<{
    session_id: string;
    checkout_url: string;
  }>;

  verifyWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<WebhookVerificationResult>;
}

export interface WebhookVerificationResult {
  valid: boolean;
  event?: PaymentEvent;
  error?: string;
}

export interface PaymentEvent {
  type: "paid" | "failed" | "refunded";
  provider_event_id: string;
  payment_reference: string;
  provider_session_id?: string;
  /** Bachs charge id (ch_...) from Connect events; ties refunds to orders. */
  charge_id?: string;
  /** For refund events: amount actually refunded, in kobo. */
  refunded_amount?: number;
  amount: Money;
}

export type PaymentProviderName = "stripe" | "bachs";
