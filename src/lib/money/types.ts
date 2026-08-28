export interface Money {
  amount: number; // Smallest currency unit (kobo for NGN)
  currency: string; // ISO 4217
}

// V1: NGN only
export const SUPPORTED_CURRENCIES = ["NGN"] as const;

export function createMoney(amount: number, currency: string = "NGN"): Money {
  if (!SUPPORTED_CURRENCIES.includes(currency as (typeof SUPPORTED_CURRENCIES)[number])) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return { amount, currency };
}

export function formatDisplayPrice(money: Money): string {
  // Display as ₦5,000 (human-readable)
  const naira = money.amount / 100;
  return `₦${naira.toLocaleString("en-NG")}`;
}

export function parseCreatorInput(nairaAmount: number): Money {
  // Creator enters 5000, we store 500000 kobo
  const kobo = Math.round(nairaAmount * 100);
  return createMoney(kobo, "NGN");
}
