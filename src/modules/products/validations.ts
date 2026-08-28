import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Product name must be 200 characters or less"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional(),
  price_amount: z
    .number()
    .min(100, "Minimum price is ₦100")
    .max(10_000_000, "Maximum price is ₦10,000,000"),
  currency: z.literal("NGN").default("NGN"),
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Product name must be 200 characters or less")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional(),
  price_amount: z
    .number()
    .min(100, "Minimum price is ₦100")
    .max(10_000_000, "Maximum price is ₦10,000,000")
    .optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
