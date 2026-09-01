import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrder } from "@/modules/orders/server/actions";
import {
  getPaymentProvider,
  isPaymentProvider,
} from "@/modules/payments/server/provider";
import { checkoutSchema } from "@/modules/payments/validations";
import {
  computePlatformFee,
  getBachsProvider,
} from "@/modules/payments/server/connect";
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
      .select(
        "id, name, price_amount, currency, status, public_id, creator_id, creators!inner(bachs_account_id, bachs_onboarding_status)"
      )
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

    /* ── Connect gating (Bachs only): the sale must be a direct charge into
       the creator's own Bachs account. Blocked BEFORE any session is created
       so no money can move for an un-onboarded creator. ── */
    let connectedAccountId: string | undefined;
    if (payment_provider === "bachs") {
      const creatorRow = (
        product as unknown as {
          creators: {
            bachs_account_id: string | null;
            bachs_onboarding_status: string;
          } | null;
        }
      ).creators;

      connectedAccountId = creatorRow?.bachs_account_id ?? undefined;
      const storedStatus = creatorRow?.bachs_onboarding_status ?? "not_started";

      if (!connectedAccountId || storedStatus !== "active") {
        // Stored flag may be stale (creator finished onboarding but the
        // dashboard hasn't refreshed). Verify live before refusing.
        let liveActive = false;
        if (connectedAccountId) {
          try {
            const caps = await getBachsProvider().getAccountCapabilities(
              connectedAccountId
            );
            liveActive = getBachsProvider().canAcceptPayments(caps);
            if (liveActive) {
              await admin
                .from("creators")
                .update({ bachs_onboarding_status: "active" })
                .eq("id", product.creator_id);
            }
          } catch {
            // Bachs unreachable: fall through to the refusal below.
          }
        }
        if (!liveActive) {
          return Response.json(
            {
              error:
                "This creator hasn't finished payout setup yet — check back soon",
            },
            { status: 400 }
          );
        }
      }
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
    const platformFeeKobo =
      payment_provider === "bachs" ? computePlatformFee(product.price_amount) : 0;
    const { session_id, checkout_url } =
      await provider.createCheckoutSession({
        orderId: order.id,
        amount: { amount: product.price_amount, currency: product.currency },
        product_name: product.name,
        buyer_email,
        success_url: `${baseUrl}/payment/success?order_id=${order.public_id}`,
        cancel_url: `${baseUrl}/p/${product.public_id}`,
        ...(payment_provider === "bachs"
          ? {
              connectedAccountId,
              platformFee: (platformFeeKobo / 100).toFixed(2),
            }
          : {}),
      });

    const { error: sessionError } = await admin
      .from("orders")
      .update({
        provider_session_id: session_id,
        ...(payment_provider === "bachs"
          ? {
              platform_fee_amount: platformFeeKobo,
              bachs_account_id: connectedAccountId,
            }
          : {}),
      })
      .eq("id", order.id)
      .eq("status", "pending");

    if (sessionError) throw new Error(sessionError.message);

    return Response.json({ checkout_url, session_id });
  } catch (error) {
    return handleApiError(error);
  }
}
