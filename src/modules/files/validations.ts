import { z } from "zod";
import { ALLOWED_MIME_TYPES, FILE_LIMITS } from "./types";

export const uploadUrlSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  file_name: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name must be 255 characters or less"),
  file_size: z
    .number()
    .min(1, "File must not be empty")
    .max(FILE_LIMITS.maxFileSize, `File size must be under ${FILE_LIMITS.maxFileSize / 1024 / 1024} MB`),
  content_type: z
    .string()
    .refine(
      (val) => (ALLOWED_MIME_TYPES as readonly string[]).includes(val),
      `File type not allowed. Allowed types: audio, images, PDF, ZIP/7z/RAR`
    ),
});

export const uploadCompleteSchema = z.object({
  file_id: z.string().uuid("Invalid file ID"),
  product_id: z.string().uuid("Invalid product ID"),
});

export type UploadUrlFormData = z.infer<typeof uploadUrlSchema>;
export type UploadCompleteFormData = z.infer<typeof uploadCompleteSchema>;
