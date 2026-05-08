import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Environment variable validation.
 * Validated at module import time — the process exits with a clear error
 * listing the missing variable(s) if any required value is absent.
 *
 * Import this module in server-side entry points (db/client.ts, stripe.ts)
 * so validation runs on startup before any request is served.
 *
 * Client-side vars must be prefixed with NEXT_PUBLIC_.
 */
export const env = createEnv({
  server: {
    // ── Clerk ────────────────────────────────────────────────────────────────
    CLERK_SECRET_KEY:        z.string().min(1),
    CLERK_WEBHOOK_SECRET:    z.string().min(1),
    APP_BASE_URL:     z.string().url(),

    // ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: z.string().url(),

    // ── Resend ───────────────────────────────────────────────────────────────
    RESEND_API_KEY:    z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email(),

    // ── Superadmin ───────────────────────────────────────────────────────────
    SUPERADMIN_EMAIL: z.string().email().default("nikolajhutten@gmail.com"),

    // ── Cron ─────────────────────────────────────────────────────────────────
    CRON_SECRET: z.string().min(1),

    // ── Scheduler (optional in local dev) ────────────────────────────────────
    SCHEDULER_SECRET: z.string().min(1).optional(),

    // ── Anthropic (optional in local dev) ────────────────────────────────────
    ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional(),

    // ── Stripe ───────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY:        z.string().startsWith("sk_").optional(),
    STRIPE_WEBHOOK_SECRET:    z.string().startsWith("whsec_"),
    STRIPE_STARTER_PRICE_ID:  z.string().startsWith("price_"),
    STRIPE_TEAM_PRICE_ID:     z.string().startsWith("price_"),
    STRIPE_BUSINESS_PRICE_ID: z.string().startsWith("price_"),

    // ── Upstash Redis (optional — rate limiting skipped when absent) ──────────
    UPSTASH_REDIS_REST_URL:   z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    // ── Cloudflare R2 ────────────────────────────────────────────────────────
    R2_ACCOUNT_ID:        z.string().min(1),
    R2_ACCESS_KEY_ID:     z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME:       z.string().min(1),
    R2_ENDPOINT:          z.string().url(),

    // ── Sentry (optional — error tracking skipped when absent) ───────────────
    SENTRY_DSN: z.string().url().optional(),
  },

  client: {
    // ── Clerk (client-side, must be NEXT_PUBLIC_) ────────────────────────────
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

    // ── Sentry (client-side, must be NEXT_PUBLIC_) ────────────────────────────
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
});
