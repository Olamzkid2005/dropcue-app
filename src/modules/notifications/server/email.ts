import type {
  PurchaseReadyEmailData,
  MagicLinkEmailData,
  FeedbackNotificationData,
} from "../types";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character
  );
}

export function renderPurchaseReadyEmail(data: PurchaseReadyEmailData): {
  subject: string;
  html: string;
} {
  const productName = escapeHtml(data.product_name);
  const downloadUrl = escapeHtml(data.download_url);
  const paymentReference = escapeHtml(data.payment_reference);
  const expiryDate = escapeHtml(
    new Date(data.expires_at).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  );

  return {
    subject: `Your files for "${data.product_name}" are ready!`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fafafa;">
  <div style="background: white; border-radius: 8px; padding: 32px; border: 1px solid #e5e5e5;">
    <h1 style="font-size: 20px; font-weight: 600; color: #171717; margin: 0 0 16px 0;">Your files are ready!</h1>
    <p style="font-size: 15px; color: #525252; line-height: 1.6; margin: 0 0 24px 0;">Hey,</p>
    <p style="font-size: 15px; color: #525252; line-height: 1.6; margin: 0 0 24px 0;">Your payment for <strong>&quot;${productName}&quot;</strong> was successful.</p>
    <a href="${downloadUrl}" style="display: inline-block; background-color: #171717; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 0 0 24px 0;">Download your files</a>
    <p style="font-size: 13px; color: #737373; line-height: 1.6; margin: 0 0 8px 0;">This download link expires on ${expiryDate}.</p>
    <p style="font-size: 13px; color: #737373; line-height: 1.6; margin: 0 0 24px 0;">Payment reference: ${paymentReference}</p>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
    <p style="font-size: 13px; color: #a3a3a3; margin: 0;">Thanks,<br>DROPCUE</p>
  </div>
</body>
</html>`,
  };
}

export function renderMagicLinkEmail(data: MagicLinkEmailData): {
  subject: string;
  html: string;
} {
  const magicLinkUrl = escapeHtml(data.magic_link_url);

  return {
    subject: "Sign in to DROPCUE",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fafafa;">
  <div style="background: white; border-radius: 8px; padding: 32px; border: 1px solid #e5e5e5;">
    <h1 style="font-size: 20px; font-weight: 600; color: #171717; margin: 0 0 16px 0;">Sign in to DROPCUE</h1>
    <p style="font-size: 15px; color: #525252; line-height: 1.6; margin: 0 0 24px 0;">Click below to sign in:</p>
    <a href="${magicLinkUrl}" style="display: inline-block; background-color: #171717; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 0 0 24px 0;">Sign in</a>
    <p style="font-size: 13px; color: #737373; line-height: 1.6; margin: 0 0 24px 0;">This link expires in 15 minutes.</p>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
    <p style="font-size: 13px; color: #a3a3a3; margin: 0;">If you didn&apos;t request this, you can safely ignore this email.</p>
  </div>
</body>
</html>`,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  broken: "Something is broken",
  confusing: "Something is confusing",
  feature_request: "Feature request",
  general: "Just giving feedback",
};

export function renderFeedbackNotificationEmail(
  data: FeedbackNotificationData
): { subject: string; html: string } {
  const categoryLabel = escapeHtml(CATEGORY_LABELS[data.category] ?? data.category);
  const message = escapeHtml(data.message).replace(/\n/g, "<br>");
  const pageUrl = escapeHtml(data.page_url);
  const submitted = escapeHtml(
    new Date(data.submitted_at).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  );
  const userEmail = data.user_email ? escapeHtml(data.user_email) : null;
  const userAgent = data.user_agent ? escapeHtml(data.user_agent.slice(0, 80)) : null;

  return {
    subject: `[Dropcue Feedback] ${CATEGORY_LABELS[data.category] ?? data.category}: ${data.message.slice(0, 60)}${data.message.length > 60 ? "..." : ""}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fafafa;">
  <div style="background: white; border-radius: 8px; padding: 32px; border: 1px solid #e5e5e5;">
    <div style="display: inline-block; background-color: #F1F5F9; color: #4338CA; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">${categoryLabel}</div>
    <h1 style="font-size: 20px; font-weight: 600; color: #171717; margin: 0 0 16px 0;">New feedback received</h1>
    <div style="background-color: #F8F9FF; border: 1px solid #E5EEFF; border-radius: 8px; padding: 20px; margin: 0 0 20px 0;"><p style="font-size: 15px; color: #0B1C30; line-height: 1.6; margin: 0;">${message}</p></div>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #525252; margin: 0 0 20px 0;">
      <tr><td style="padding: 6px 0; color: #737373; width: 100px;">Page</td><td style="padding: 6px 0;"><a href="${pageUrl}" style="color: #4338CA; text-decoration: none;">${pageUrl}</a></td></tr>
      ${userEmail ? `<tr><td style="padding: 6px 0; color: #737373;">Email</td><td style="padding: 6px 0;">${userEmail}</td></tr>` : ""}
      ${data.user_id ? `<tr><td style="padding: 6px 0; color: #737373;">User ID</td><td style="padding: 6px 0; font-family: monospace; font-size: 12px;">${escapeHtml(data.user_id.slice(0, 8))}...</td></tr>` : ""}
      ${data.product_id ? `<tr><td style="padding: 6px 0; color: #737373;">Product</td><td style="padding: 6px 0; font-family: monospace; font-size: 12px;">${escapeHtml(data.product_id.slice(0, 8))}...</td></tr>` : ""}
      ${data.order_id ? `<tr><td style="padding: 6px 0; color: #737373;">Order</td><td style="padding: 6px 0; font-family: monospace; font-size: 12px;">${escapeHtml(data.order_id.slice(0, 8))}...</td></tr>` : ""}
      <tr><td style="padding: 6px 0; color: #737373;">Submitted</td><td style="padding: 6px 0;">${submitted}</td></tr>
      ${userAgent ? `<tr><td style="padding: 6px 0; color: #737373;">Device</td><td style="padding: 6px 0; font-size: 11px;">${userAgent}</td></tr>` : ""}
    </table>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
    <p style="font-size: 13px; color: #a3a3a3; margin: 0;">Sent from Dropcue Feedback System</p>
  </div>
</body>
</html>`,
  };
}
