import type { PaymentProvider, PaymentProviderName } from "../types";
import { StripeProvider } from "./stripe";
import { BachsProvider } from "./bachs";

const providers: Record<PaymentProviderName, () => PaymentProvider> = {
  stripe: () => new StripeProvider(),
  bachs: () => new BachsProvider(),
};

export function getPaymentProvider(name: PaymentProviderName): PaymentProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(`Unknown payment provider: ${name}`);
  }
  return factory();
}

export function isPaymentProvider(name: string): name is PaymentProviderName {
  return name === "stripe" || name === "bachs";
}
