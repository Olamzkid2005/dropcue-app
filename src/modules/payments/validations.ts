import { z } from "zod";

export const checkoutSchema = z.object({
  buyer_email: z.string().email("Please enter a valid email address"),
  payment_provider: z.enum(["stripe", "bachs"]).default("bachs"),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
