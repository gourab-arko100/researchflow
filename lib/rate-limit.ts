type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * In-memory sliding-window rate limiter, keyed per user (or per IP for the
 * unauthenticated /demo actions). This works correctly within a single
 * long-lived process — local dev, a traditional Node server, Vercel's Fluid
 * Compute. On classic per-request serverless, where each invocation can be a
 * fresh process with an empty Map, it degrades to a no-op rather than
 * actually limiting anything. That's a real limitation, documented rather
 * than silently pretended away — a production deployment at meaningful scale
 * should swap this for a shared store (e.g. `@upstash/ratelimit`). For a
 * portfolio-scale app on a single instance, this is a genuine safeguard.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function assertRateLimit(key: string, limit: number, windowMs: number): void {
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.allowed) {
    throw new Error(`Too many requests — try again in ${result.retryAfterSeconds}s`);
  }
}

/** Best-effort client IP for rate-limiting the unauthenticated /demo actions,
 * which have no user id to key on. Trusts the platform's forwarded-for header
 * (set by Vercel's edge network); falls back to a shared bucket if absent,
 * which just means local dev shares one rate-limit bucket across all visitors
 * — fine for its purpose here (abuse prevention, not per-user fairness). */
export async function getClientIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
