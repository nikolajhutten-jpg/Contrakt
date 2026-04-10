import * as Sentry from "@sentry/nextjs";

/**
 * Sentry server-side configuration.
 * Initialised in the Node.js runtime — captures exceptions from API routes,
 * server actions, and any server-side code that calls Sentry.captureException.
 *
 * Set SENTRY_DSN in .env.local (or your deployment environment) to enable.
 * When SENTRY_DSN is absent Sentry is a no-op and no data is sent.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Capture 10 % of transactions for performance tracing.
  // TODO: tune before production launch based on traffic volume.
  tracesSampleRate: 0.1,

  // Disable debug output in production.
  debug: false,
});
