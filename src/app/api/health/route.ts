import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    ),
    webhookSecret: Boolean(
      process.env.BACHS_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET
    ),
    appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  };

  const healthy = Object.values(checks).every(Boolean);
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
