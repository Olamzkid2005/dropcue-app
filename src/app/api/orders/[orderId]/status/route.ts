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

    const { data: order } = await admin
      .from("orders")
      .select("id, status, product_id")
      .eq("id", orderId)
      .single();

    if (!order) {
      return Response.json({ status: "failed", error: "Order not found" }, { status: 404 });
    }

    let deliveryToken: string | null = null;
    let productName: string | null = null;

    if (order.status === "paid") {
      // Get delivery token
      const { data: delivery } = await admin
        .from("deliveries")
        .select("delivery_token")
        .eq("order_id", orderId)
        .single();

      deliveryToken = delivery?.delivery_token ?? null;

      // Get product name
      const { data: product } = await admin
        .from("products")
        .select("name")
        .eq("id", order.product_id)
        .single();

      productName = product?.name ?? null;
    }

    return Response.json({
      status: order.status,
      delivery_token: deliveryToken,
      product_name: productName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
