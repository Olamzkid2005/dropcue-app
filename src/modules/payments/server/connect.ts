import { BachsProvider } from "./bachs";

/**
 * Platform fee + Connect policy.
 *
 * The platform fee is split back to the platform by Bachs on every direct
 * charge (platform_fee field on the checkout session). On a FULL refund we
 * voluntarily return the fee to the creator via a platform->account transfer
 * (product decision, 2026-09). Partial refunds keep the fee.
 */
export const PLATFORM_FEE_PERCENT = 5;

/** Kobo -> platform fee in kobo (rounded half-up). */
export function computePlatformFee(amountKobo: number): number {
  return Math.round((amountKobo * PLATFORM_FEE_PERCENT) / 100);
}

export function getBachsProvider(): BachsProvider {
  return new BachsProvider();
}

export type PayoutSetupStatus =
  | "active" // connected account can accept payments
  | "pending" // account exists, onboarding not finished
  | "not_started" // no Bachs account yet
  | "unavailable"; // Bachs not configured / connect capability missing

/** Live status from Bachs for a creator's connected account. */
export async function getCreatorBachsStatus(
  accountId: string
): Promise<PayoutSetupStatus> {
  const provider = getBachsProvider();
  const caps = await provider.getAccountCapabilities(accountId);
  return provider.canAcceptPayments(caps) ? "active" : "pending";
}
