import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  const body = [
    "Contact: mailto:security@dropcue.com",
    "Preferred-Languages: en",
    "Canonical: https://dropcue.com/.well-known/security.txt",
    "Expires: 2027-09-15T00:00:00.000Z",
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
