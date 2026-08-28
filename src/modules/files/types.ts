export interface FileRecord {
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

export interface UploadUrlRequest {
  product_id: string;
  file_name: string;
  file_size: number;
  content_type: string;
}

export interface UploadUrlResponse {
  upload_url: string;
  file_id: string;
  storage_key: string;
}

export interface UploadCompleteRequest {
  file_id: string;
  product_id: string;
}

// Allowed MIME types for V1
export const ALLOWED_MIME_TYPES = [
  // Audio
  "audio/wav",
  "audio/mpeg",
  "audio/flac",
  "audio/aac",
  "audio/mp4",
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  // Documents
  "application/pdf",
  // Archives
  "application/zip",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// File limits (V1)
export const FILE_LIMITS = {
  maxFileSize: 500 * 1024 * 1024, // 500 MB
  maxFilesPerProduct: 10,
  maxTotalProductSize: 2 * 1024 * 1024 * 1024, // 2 GB
} as const;
