"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { submitFeedbackSchema } from "../validations";
import type { SubmitFeedbackInput } from "../types";

/**
 * Submit user feedback.
 * Captures page context, optional user identity, and the feedback itself.
 */
export async function submitFeedback(input: SubmitFeedbackInput) {
  const parsed = submitFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const { category, message, email, page_url, product_id, order_id } =
    parsed.data;

  // Try to get current user (may be null for anonymous buyers)
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Not authenticated — that's fine for buyer feedback
  }

  const admin = createAdminClient();

  // Get user agent from headers (best effort)
  let userAgent: string | null = null;
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    userAgent = h.get("user-agent") ?? null;
  } catch {
    // Not available in all contexts
  }

  const { error } = await admin.from("feedback").insert({
    user_id: userId,
    email: email || null,
    category,
    message,
    page_url,
    product_id: product_id || null,
    order_id: order_id || null,
    user_agent: userAgent,
  });

  if (error) {
    console.error("Failed to submit feedback:", error);
    return { success: false, error: "Failed to submit feedback" };
  }

  await logAuditEvent("feedback_submitted", "feedback", "feedback", {
    category,
    page_url,
    has_user: !!userId,
  });

  // Send admin notification email (async, don't block response)
  try {
    const { sendFeedbackNotification } = await import("@/modules/notifications/server/actions");
    await sendFeedbackNotification({
      category,
      message,
      page_url,
      user_email: email || null,
      user_id: userId,
      product_id: product_id || null,
      order_id: order_id || null,
      user_agent: userAgent,
      submitted_at: new Date().toISOString(),
    });
  } catch (err) {
    // Email failure doesn't affect feedback submission
    console.error("Failed to send feedback notification:", err);
  }

  return { success: true };
}
