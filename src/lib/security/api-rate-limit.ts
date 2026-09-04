import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS, type RateLimitKey } from "./rate-limit";

/**
 * Get the client IP from the request headers provided by the hosting platform.
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Apply a distributed rate limit to an API route handler.
 * Returns a NextResponse with 429 status if rate limited, or null if allowed.
 */
export async function rateLimit(
  request: NextRequest,
  limitKey: RateLimitKey
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[limitKey];
  const result = await checkRateLimit(
    `${limitKey}:${getClientIp(request)}`,
    limitKey
  );

  if (!result.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000)
    );

    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      }
    );
  }

  return null;
}
