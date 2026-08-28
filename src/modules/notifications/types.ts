export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface PurchaseReadyEmailData {
  buyer_email: string;
  product_name: string;
  download_url: string;
  expires_at: string;
  payment_reference: string;
}

export interface MagicLinkEmailData {
  email: string;
  magic_link_url: string;
}

export interface FeedbackNotificationData {
  category: string;
  message: string;
  page_url: string;
  user_email: string | null;
  user_id: string | null;
  product_id: string | null;
  order_id: string | null;
  user_agent: string | null;
  submitted_at: string;
}
