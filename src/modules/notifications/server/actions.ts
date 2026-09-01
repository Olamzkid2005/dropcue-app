"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, EMAIL_FROM } from "@/lib/email";
import { renderPurchaseReadyEmail, renderFeedbackNotificationEmail } from "./email";
import { logAuditEvent } from "@/lib/audit";
import type { PurchaseReadyEmailData, FeedbackNotificationData } from "../types";

/**
 * Send purchase-ready email with download link.
 * Called after order fulfillment (payment + delivery created).
 */
export async function sendPurchaseReadyEmail(params: {
  order_id: string;
  buyer_email: string;
  product_name: string;
  delivery_token: string;
  expires_at: string;
  payment_reference: string;
}) {
  const admin = createAdminClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const downloadUrl = `${baseUrl}/download/${params.delivery_token}`;

  const emailData: PurchaseReadyEmailData = {
    buyer_email: params.buyer_email,
    product_name: params.product_name,
    download_url: downloadUrl,
    expires_at: params.expires_at,
    payment_reference: params.payment_reference,
  };

  const { subject, html } = renderPurchaseReadyEmail(emailData);

  // Create email delivery record
  const { data: emailRecord, error: emailRecordError } = await admin
    .from("email_deliveries")
    .insert({
      order_id: params.order_id,
      type: "purchase_ready",
      status: "sending",
    })
    .select()
    .single();

  if (emailRecordError) {
    console.error("Failed to create email delivery record:", emailRecordError);
  }

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.buyer_email,
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    // Update email delivery record
    if (emailRecord) {
      await admin
        .from("email_deliveries")
        .update({
          status: "sent",
          provider_id: data?.id ?? null,
          sent_at: new Date().toISOString(),
          attempts: 1,
        })
        .eq("id", emailRecord.id);
    }

    await logAuditEvent("email_sent", "order", params.order_id, {
      type: "purchase_ready",
      to: params.buyer_email,
    });

    return { success: true };
  } catch (err) {
    // Update email delivery record with failure
    if (emailRecord) {
      await admin
        .from("email_deliveries")
        .update({
          status: "failed",
          last_error: err instanceof Error ? err.message : "Unknown error",
          attempts: 1,
        })
        .eq("id", emailRecord.id);
    }

    await logAuditEvent("email_failed", "order", params.order_id, {
      type: "purchase_ready",
      error: err instanceof Error ? err.message : "Unknown error",
    });

    // Email failure doesn't block purchase — buyer can still download
    return { success: false, error: err instanceof Error ? err.message : "Email failed" };
  }
}

/**
 * Send admin notification when feedback is submitted.
 * Called from the feedback submission action.
 * Email failure is silent — feedback is already saved in the DB.
 */
export async function sendFeedbackNotification(data: FeedbackNotificationData) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    // No admin email configured — skip silently
    return { success: false, error: "ADMIN_EMAIL not configured" };
  }

  const { subject, html } = renderFeedbackNotificationEmail(data);

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: adminEmail,
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    await logAuditEvent("email_sent", "feedback", data.feedback_id, {
      type: "feedback_notification",
      feedback_id: data.feedback_id,
      to: adminEmail,
      category: data.category,
    });

    return { success: true };
  } catch (err) {
    await logAuditEvent("email_failed", "feedback", data.feedback_id, {
      type: "feedback_notification",
      error: err instanceof Error ? err.message : "Unknown error",
    });

    // Email failure doesn't affect feedback submission
    return { success: false, error: err instanceof Error ? err.message : "Email failed" };
  }
}
