import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";

type RateLimitKey = keyof typeof RATE_LIMITS;

/**
 * Get client IP from request headers.
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Apply rate limiting to an API route handler.
 * Returns a NextResponse with 429 status if rate limited, or null if allowed.
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimited = await rateLimit(request, "checkout");
 *   if (rateLimited) return rateLimited;
 *   // ... handle request
 * }
 * ```
 */
export function rateLimit(
  request: NextRequest,
  limitKey: RateLimitKey
): NextResponse | null {
  const ip = getClientIp(request);
  const config = RATE_LIMITS[limitKey];
  const key = `${limitKey}:${ip}`;

  const result = checkRateLimit(key, config.maxRequests, config.windowMs);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(config.windowMs / 1000)),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
