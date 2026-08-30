import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/modules/orders/server/actions";
import { getPaymentProvider, isPaymentProvider } from "@/modules/payments/server/provider";
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
    const { productId } = paramsParsed.data;
    const body = await request.json();

    // Validate input
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { buyer_email, payment_provider } = parsed.data;

    if (!isPaymentProvider(payment_provider)) {
      return Response.json(
        { error: "Unsupported payment provider" },
        { status: 400 }
      );
    }

    // Get product details (single fetch — public_id included so we don't
    // re-fetch it later for the cancel_url)
    const supabase = await createClient();
    const { data: product } = await supabase
      .from("products")
      .select("id, name, price_amount, currency, status, public_id")
      .eq("id", productId)
      .single();

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.status === "archived") {
      return Response.json(
        { error: "Product is no longer available" },
        { status: 400 }
      );
    }

    // Create order — createOrder validates file availability itself,
    // and skips its own product re-fetch since we pass the verified product.
    const { order, error: orderError } = await createOrder({
      product_id: productId,
      buyer_email,
      payment_provider,
      amount: product.price_amount,
      currency: product.currency,
      product: { id: product.id, status: product.status },
    });

    if (!order) {
      return Response.json({ error: orderError }, { status: 400 });
    }

    // Create checkout session with payment provider
    const provider = getPaymentProvider(payment_provider);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { session_id, checkout_url } = await provider.createCheckoutSession({
      orderId: order.id,
      amount: { amount: product.price_amount, currency: product.currency },
      product_name: product.name,
      buyer_email,
      success_url: `${baseUrl}/payment/success?order_id=${order.id}`,
      cancel_url: `${baseUrl}/p/${product.public_id}`,
      webhook_url: `${baseUrl}/api/webhooks/${payment_provider}`,
    });

    // Update order with session ID
    await supabase
      .from("orders")
      .update({ provider_session_id: session_id })
      .eq("id", order.id);

    return Response.json({ checkout_url, session_id });
  } catch (error) {
    return handleApiError(error);
  }
}
