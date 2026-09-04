import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const RATE_LIMITS = {
  /** Magic link: 3 per email per 15 minutes */
  magicLink: { maxRequests: 3, window: "15 m" },
  /** Checkout: 10 per IP per hour */
  checkout: { maxRequests: 10, window: "1 h" },
  /** Upload: 20 per user per hour */
  upload: { maxRequests: 20, window: "1 h" },
  /** Download: 30 per IP per hour */
  download: { maxRequests: 30, window: "1 h" },
  /** General API: 60 per IP per minute */
  api: { maxRequests: 60, window: "1 m" },
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset: number;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedisConfig = Boolean(redisUrl && redisToken);

const redis = hasRedisConfig
  ? new Redis({ url: redisUrl!, token: redisToken! })
  : null;

const limiters = Object.fromEntries(
  Object.entries(RATE_LIMITS).map(([key, config]) => [
    key,
    redis
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(config.maxRequests, config.window),
          prefix: `dropcue:ratelimit:${key}`,
          analytics: true,
          timeout: 2_000,
        })
      : null,
  ])
) as Record<RateLimitKey, Ratelimit | null>;

/**
 * Check a distributed rate limit with Upstash Redis.
 *
 * In development, missing Redis configuration leaves local work usable.
 * In production, missing or unreachable Redis fails closed so a Vercel
 * instance cannot silently bypass the global limit.
 */
export async function checkRateLimit(
  key: string,
  limitKey: RateLimitKey
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[limitKey];
  const limiter = limiters[limitKey];

  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      return {
        allowed: false,
        remaining: 0,
        reset: Date.now() + 60_000,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests,
      reset: Date.now() + 60_000,
    };
  }

  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: Math.max(0, result.remaining),
      reset: result.reset,
    };
  } catch (error) {
    console.error("Rate limiter unavailable:", error);
    if (process.env.NODE_ENV === "production") {
      return {
        allowed: false,
        remaining: 0,
        reset: Date.now() + 60_000,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests,
      reset: Date.now() + 60_000,
    };
  }
}
