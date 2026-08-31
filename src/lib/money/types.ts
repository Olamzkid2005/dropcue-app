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

export function formatNairaInput(value: string | number): string {
  const digits = String(value).replace(/[^0-9]/g, "");
  return digits ? Number(digits).toLocaleString("en-NG") : "";
}

export function amountInWords(value: string | number): string {
  const amount = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return "";

  const ones = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  function underThousand(number: number): string {
    if (number < 20) return ones[number];
    if (number < 100) return `${tens[Math.floor(number / 10)]}${number % 10 ? `-${ones[number % 10]}` : ""}`;
    return `${ones[Math.floor(number / 100)]} hundred${number % 100 ? ` and ${underThousand(number % 100)}` : ""}`;
  }

  const wholeAmount = Math.floor(amount);
  const millions = Math.floor(wholeAmount / 1_000_000);
  const thousands = Math.floor((wholeAmount % 1_000_000) / 1_000);
  const remainder = wholeAmount % 1_000;
  const parts = [
    millions ? `${underThousand(millions)} million` : "",
    thousands ? `${underThousand(thousands)} thousand` : "",
    remainder ? underThousand(remainder) : "",
  ].filter(Boolean);

  return `${parts.join(" ")} naira`;
}
