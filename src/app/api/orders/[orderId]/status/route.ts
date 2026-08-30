import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/api-rate-limit";

const orderParamsSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const rateLimited = rateLimit(request, "api");
  if (rateLimited) return rateLimited;

  try {
    const rawParams = await params;
    const parsed = orderParamsSchema.safeParse(rawParams);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { orderId } = parsed.data;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ status: "failed", error: "Service not configured" }, { status: 503 });
    }

    const admin = createAdminClient();

    /* Single round-trip: order + delivery token + product name via embeds.
       This endpoint is polled by the payment success page — every saved
       round-trip multiplies across polls. */
    const { data: order } = await admin
      .from("orders")
      .select("id, status, deliveries(delivery_token), products(name)")
      .eq("id", orderId)
      .single();

    if (!order) {
      return Response.json({ status: "failed", error: "Order not found" }, { status: 404 });
    }

    const deliveryToken =
      (order as { deliveries?: Array<{ delivery_token: string } | null> })
        .deliveries?.[0]?.delivery_token ?? null;
    const productName =
      (order as unknown as { products?: { name: string } | null }).products?.name ?? null;

    return Response.json({
      status: order.status,
      delivery_token: order.status === "paid" ? deliveryToken : null,
      product_name: order.status === "paid" ? productName : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
