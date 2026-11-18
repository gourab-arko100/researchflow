import { db } from "@/lib/db";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * In-memory fixed-window limiter. Only used as a fallback when the database
 * limiter below is unavailable (and by the unit tests). On Vercel each
 * request can land on a fresh instance, so this alone does NOT protect a
 * production deployment — that's what `assertRateLimit` (database-backed)
 * is for.
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

// ---------------------------------------------------------------------------
// Database-backed limiter — shared across every serverless instance, so the
// limits actually hold on Vercel. Uses the "RateLimit" table (see
// prisma/schema.prisma). The table is also created on first use, so the app
// keeps working even if `prisma db push` hasn't been run yet.
// ---------------------------------------------------------------------------

let tableReady: Promise<void> | null = null;

function ensureRateLimitTable(): Promise<void> {
  if (!tableReady) {
    tableReady = db
      .$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "RateLimit" ("key" TEXT NOT NULL PRIMARY KEY, "count" INTEGER NOT NULL, "resetAt" BIGINT NOT NULL)`
      )
      .then(() => undefined)
      .catch((err) => {
        tableReady = null;
        throw err;
      });
  }
  return tableReady;
}

async function checkRateLimitDb(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  await ensureRateLimitTable();

  const now = Date.now();
  const resetAt = now + windowMs;

  // Atomic upsert: start a new window if the old one expired, otherwise
  // increment. Safe under concurrent requests.
  // BigInt so the epoch-ms values bind as Postgres BIGINT, not INTEGER.
  const nowB = BigInt(now);
  const resetB = BigInt(resetAt);
  const rows = await db.$queryRaw<{ count: number; resetAt: bigint }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetB})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" <= ${nowB} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${nowB} THEN ${resetB} ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"
  `;

  // Occasionally clear out long-expired rows so the table stays small.
  if (Math.random() < 0.01) {
    db.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < ${BigInt(now - 24 * 60 * 60 * 1000)}`.catch(() => {});
  }

  const row = rows[0];
  if (!row) return { allowed: true };

  const count = Number(row.count);
  if (count > limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((Number(row.resetAt) - now) / 1000)) };
  }
  return { allowed: true };
}

/** Throws if `key` has made more than `limit` calls within `windowMs`. */
export async function assertRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  let result: { allowed: boolean; retryAfterSeconds?: number };
  try {
    result = await checkRateLimitDb(key, limit, windowMs);
  } catch (err) {
    // Database hiccup: fall back to the per-instance limiter rather than
    // letting everything through unchecked.
    console.error("Rate limiter: database check failed, using in-memory fallback", err);
    result = checkRateLimit(key, limit, windowMs);
  }
  if (!result.allowed) {
    throw new Error(`Too many requests — try again in ${result.retryAfterSeconds}s`);
  }
}

/** Client IP for rate-limiting signed-out visitors (the /demo actions).
 * On Vercel, `x-real-ip` and `x-forwarded-for` are set by Vercel's edge and
 * can't be spoofed by the visitor. */
export async function getClientIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
