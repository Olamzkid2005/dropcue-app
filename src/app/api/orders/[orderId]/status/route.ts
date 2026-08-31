import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/api-rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const rateLimited = rateLimit(request, "api");
  if (rateLimited) return rateLimited;

  try {
    const { orderId } = await params;
    if (!/^[A-Za-z0-9_-]{12,64}$/.test(orderId)) {
      return Response.json({ error: "Invalid order ID" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        { status: "failed", error: "Service not configured" },
        { status: 503 }
      );
    }

    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("public_id, status, deliveries(delivery_token), products(name)")
      .eq("public_id", orderId)
      .maybeSingle();

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
