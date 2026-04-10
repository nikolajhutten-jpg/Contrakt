import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Tiers ────────────────────────────────────────────────────────────────────

/**
 * Three rate limit tiers (requests per minute, sliding window):
 *   strict   — 5/min   for auth endpoints (/api/auth/signup, etc.)
 *   standard — 60/min  for mutating API routes (POST, PATCH, DELETE)
 *   relaxed  — 200/min for read-only API routes (GET)
 *
 * Rate limiting is skipped entirely when Upstash credentials are absent,
 * so development environments work without Redis configured.
 */
export type RateLimitTier = "strict" | "standard" | "relaxed";

const TIER_CONFIG: Record<RateLimitTier, { requests: number; window: "1 m" }> =
  {
    strict:   { requests: 5,   window: "1 m" },
    standard: { requests: 60,  window: "1 m" },
    relaxed:  { requests: 200, window: "1 m" },
  };

// ─── Lazy singleton ───────────────────────────────────────────────────────────
//
// Limiters are created once per process/worker after the first call.
// If Redis credentials are absent the map stays null and all checks pass.

let limiters: Record<RateLimitTier, Ratelimit> | null = null;

function getLimiters(): Record<RateLimitTier, Ratelimit> | null {
  if (limiters !== null) return limiters;

  // TODO: add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env.local
  // Obtain credentials from https://console.upstash.com → your Redis database
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Credentials not set — skip rate limiting (fail open)
    return null;
  }

  const redis = new Redis({ url, token });

  limiters = {
    strict: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        TIER_CONFIG.strict.requests,
        TIER_CONFIG.strict.window,
      ),
      prefix: "contrakt:rl:strict",
    }),
    standard: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        TIER_CONFIG.standard.requests,
        TIER_CONFIG.standard.window,
      ),
      prefix: "contrakt:rl:standard",
    }),
    relaxed: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        TIER_CONFIG.relaxed.requests,
        TIER_CONFIG.relaxed.window,
      ),
      prefix: "contrakt:rl:relaxed",
    }),
  };

  return limiters;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  reset: number;
}

/**
 * Checks whether `identifier` (typically the client IP) has exceeded the
 * rate limit for the given tier.
 *
 * Always returns `{ success: true }` when Redis is not configured or
 * when the Redis call fails — rate limiting is never the reason the app
 * goes down.
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier,
): Promise<RateLimitResult> {
  const map = getLimiters();
  if (!map) return { success: true, limit: 0, remaining: 0, reset: 0 };

  try {
    return await map[tier].limit(`${tier}:${identifier}`);
  } catch {
    // Fail open — Redis outage must not block the application
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}
