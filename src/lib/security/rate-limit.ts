const rateLimitStore = new Map<string, { count: number; reset: number }>();

/**
 * Simple in-memory rate limiter.
 * For production, use Redis or Upstash for distributed rate limiting.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.reset) {
    rateLimitStore.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Rate limit configurations for different endpoints.
 */
export const RATE_LIMITS = {
  /** Magic link: 3 per email per 15 minutes */
  magicLink: { maxRequests: 3, windowMs: 15 * 60 * 1000 },
  /** Checkout: 10 per IP per hour */
  checkout: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  /** Upload: 20 per user per hour */
  upload: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  /** Download: 30 per IP per hour */
  download: { maxRequests: 30, windowMs: 60 * 60 * 1000 },
  /** General API: 60 per IP per minute */
  api: { maxRequests: 60, windowMs: 60 * 1000 },
} as const;

/**
 * Clean up expired entries periodically.
 * Call this in a background interval if needed.
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.reset) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
