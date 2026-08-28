export interface Order {
  id: string;
  product_id: string;
  public_id: string;
  buyer_email: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  payment_provider: string;
  payment_reference: string | null;
  provider_session_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  delivery_token: string;
  status: "active" | "expired" | "revoked";
  expires_at: string;
  download_count: number;
  max_downloads: number;
  created_at: string;
}
