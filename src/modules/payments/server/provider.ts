import type { PaymentProvider, PaymentProviderName } from "../types";
import { StripeProvider } from "./stripe";
import { BachsProvider } from "./bachs";

export function getPaymentProvider(name: PaymentProviderName): PaymentProvider {
  if (name === "stripe") return new StripeProvider();
  return new BachsProvider();
}

export function isPaymentProvider(name: string): name is PaymentProviderName {
  return name === "stripe" || name === "bachs";
}
