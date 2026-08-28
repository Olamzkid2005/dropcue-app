export interface Product {
  id: string;
  public_id: string;
  creator_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  price_amount: number; // In kobo (smallest currency unit)
  currency: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface ProductWithFiles extends Product {
  files: ProductFile[];
}

export interface ProductFile {
  id: string;
  product_id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  file_size: number;
  status: "uploading" | "uploaded" | "failed";
  expires_at: string | null;
  created_at: string;
}

export type ProductStatus = Product["status"];

export interface CreateProductInput {
  name: string;
  description?: string;
  price_amount: number; // In naira, converted to kobo server-side
  currency?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price_amount?: number;
  status?: ProductStatus;
}
