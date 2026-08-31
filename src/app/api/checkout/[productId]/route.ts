import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrder } from "@/modules/orders/server/actions";
import {
  getPaymentProvider,
  isPaymentProvider,
} from "@/modules/payments/server/provider";
import { checkoutSchema } from "@/modules/payments/validations";
import { handleApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/api-rate-limit";

const checkoutParamsSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const rateLimited = rateLimit(request, "checkout");
  if (rateLimited) return rateLimited;

  try {
    const rawParams = await params;
    const paramsParsed = checkoutParamsSchema.safeParse(rawParams);
    if (!paramsParsed.success) {
      return Response.json(
        { error: paramsParsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { productId } = paramsParsed.data;
    const { buyer_email, payment_provider } = parsed.data;
    if (!isPaymentProvider(payment_provider)) {
      return Response.json(
        { error: "Unsupported payment provider" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: product, error: productError } = await admin
      .from("products")
      .select("id, name, price_amount, currency, status, public_id")
      .eq("id", productId)
      .maybeSingle();

    if (productError) throw new Error(productError.message);
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    if (product.status !== "published") {
      return Response.json(
        { error: "Product is no longer available" },
        { status: 400 }
      );
    }

    const { order, error: orderError } = await createOrder({
      product_id: productId,
      buyer_email,
      payment_provider,
      amount: product.price_amount,
      currency: product.currency,
    });

    if (!order) {
      return Response.json({ error: orderError }, { status: 400 });
    }

    const provider = getPaymentProvider(payment_provider);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { session_id, checkout_url } =
      await provider.createCheckoutSession({
        orderId: order.id,
        amount: { amount: product.price_amount, currency: product.currency },
        product_name: product.name,
        buyer_email,
        success_url: `${baseUrl}/payment/success?order_id=${order.public_id}`,
        cancel_url: `${baseUrl}/p/${product.public_id}`,
      });

    const { error: sessionError } = await admin
      .from("orders")
      .update({ provider_session_id: session_id })
      .eq("id", order.id)
      .eq("status", "pending");

    if (sessionError) throw new Error(sessionError.message);

    return Response.json({ checkout_url, session_id });
  } catch (error) {
    return handleApiError(error);
  }
}
