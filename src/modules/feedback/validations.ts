import { z } from "zod";

export const submitFeedbackSchema = z.object({
  category: z.enum(["broken", "confusing", "feature_request", "general"]),
  message: z
    .string()
    .min(1, "Please enter your feedback")
    .max(2000, "Feedback must be 2000 characters or less"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  page_url: z
    .string()
    .min(1, "Page URL is required")
    .max(2048)
    .refine(
      (value) => value.startsWith("/") && !value.startsWith("//") || /^https?:\/\//i.test(value),
      "Page URL must be a relative path or an HTTP(S) URL"
    ),
  product_id: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
});

export type SubmitFeedbackFormData = z.infer<typeof submitFeedbackSchema>;
