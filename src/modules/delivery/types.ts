import type { Order } from "@/modules/orders/types";

export interface DeliveryInfo {
  id: string;
  order_id: string;
  delivery_token: string;
  status: "active" | "expired" | "revoked";
  expires_at: string;
  download_count: number;
  max_downloads: number;
  created_at: string;
}

export interface DeliveryWithOrder extends DeliveryInfo {
  order: Order;
  product: {
    id: string;
    name: string;
    description: string | null;
    creator_id: string;
  };
  files: DeliveryFile[];
}

export interface DeliveryFile {
  id: string;
  product_id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  file_size: number;
  status: string;
  expires_at: string | null;
}

export type DeliveryStatus =
  | "processing"
  | "ready"
  | "expired"
  | "files_unavailable"
  | "invalid";
