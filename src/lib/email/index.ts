import { Resend } from "resend";

let resend: Resend | null = null;

export function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");
    resend = new Resend(apiKey);
  }
  return resend;
}

export const EMAIL_FROM = "DROPCUE <noreply@dropcue.com>";
