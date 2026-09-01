"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import {
  getBachsProvider,
  getCreatorBachsStatus,
  type PayoutSetupStatus,
} from "./connect";

export interface PayoutSetupState {
  status: PayoutSetupStatus;
  /** True when Bachs itself is unreachable/misconfigured — creators see nothing. */
  unavailableReason?: string;
}

/**
 * Status of the signed-in creator's Bachs payout setup.
 * Reads the creator row; if an account exists, verifies capabilities live
 * (so "active" is the truth, not a stale flag).
 */
export async function getPayoutSetupStatus(): Promise<PayoutSetupState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { status: "unavailable", unavailableReason: "Not signed in" };

    const { data: creator } = await supabase
      .from("creators")
      .select("bachs_account_id, bachs_onboarding_status")
      .eq("id", user.id)
      .maybeSingle();

    if (!creator) return { status: "not_started" };
    if (!creator.bachs_account_id) {
      return {
        status:
          creator.bachs_onboarding_status === "not_started"
            ? "not_started"
            : (creator.bachs_onboarding_status as PayoutSetupStatus),
      };
    }

    // Account exists: trust Bachs, not our stored flag.
    const live = await getCreatorBachsStatus(creator.bachs_account_id);
    if (live !== creator.bachs_onboarding_status) {
      await supabase
        .from("creators")
        .update({ bachs_onboarding_status: live })
        .eq("id", user.id);
    }
    return { status: live };
  } catch (error) {
    console.error("payout setup status failed:", error);
    return {
      status: "unavailable",
      unavailableReason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create the creator's Bachs account if needed, mint an onboarding link,
 * and return the URL to redirect to. The link is created at the moment of
 * redirect only (issuing one invalidates any prior active link).
 */
export async function startPayoutSetup(): Promise<{
  success: boolean;
  onboarding_url?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const provider = getBachsProvider();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const refreshUrl = `${baseUrl}/dashboard?connect=refresh`;
    const returnUrl = `${baseUrl}/dashboard?connect=return`;

    let { data: creator } = await supabase
      .from("creators")
      .select("bachs_account_id, bachs_onboarding_status, email")
      .eq("id", user.id)
      .maybeSingle();

    if (!creator) {
      const { error } = await supabase
        .from("creators")
        .insert({ id: user.id, email: user.email ?? "" });
      if (error) return { success: false, error: error.message };
      creator = {
        bachs_account_id: null,
        bachs_onboarding_status: "not_started",
        email: user.email ?? "",
      };
    }

    if (!creator.bachs_account_id) {
      const { accountId } = await provider.createConnectedAccount({
        email: creator.email || (user.email ?? ""),
        displayName: (user.email ?? "creator").split("@")[0],
      });
      if (!accountId) {
        return { success: false, error: "Bachs did not return an account id" };
      }
      const { error } = await supabase
        .from("creators")
        .update({
          bachs_account_id: accountId,
          bachs_onboarding_status: "pending",
        })
        .eq("id", user.id);
      if (error) return { success: false, error: error.message };
      await logAuditEvent("bachs_account_created", "creator", user.id, {
        bachs_account_id: accountId,
      });
    }

    const { url } = await provider.createOnboardingLink({
      accountId: creator.bachs_account_id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
    });
    return { success: true, onboarding_url: url };
  } catch (error) {
    console.error("start payout setup failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
