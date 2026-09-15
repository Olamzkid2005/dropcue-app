import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const report = await request.text();
    if (report.length > 64_000) {
      return new NextResponse(null, { status: 413 });
    }
    console.warn("Browser security report:", report.slice(0, 64_000));
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 204 });
}
