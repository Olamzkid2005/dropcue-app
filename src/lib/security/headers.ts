import { NextResponse } from "next/server";

/**
 * Apply security headers to responses.
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Strict Transport Security — enforce HTTPS without opting into preload.
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains"
  );

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking in modern and legacy browsers.
  response.headers.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests; img-src 'self' data: blob: https://*.supabase.co https://api.dicebear.com; font-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co https://*.upstash.io https://sandbox-api.bachs.io https://api.bachs.io https://api.stripe.com; media-src 'self' blob:; worker-src 'self' blob:;");
  response.headers.set("X-Frame-Options", "DENY");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy — disable camera, microphone, geolocation by default
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), usb=(), payment=()"
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set("Reporting-Endpoints", 'default="/api/security/report"');
  response.headers.set("Link", '</llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="sitemap"');
  response.headers.set("Cache-Control", response.headers.get("Cache-Control") ?? "no-cache");

  return response;
}
