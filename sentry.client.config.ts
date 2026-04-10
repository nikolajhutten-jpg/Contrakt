import * as Sentry from "@sentry/nextjs";

/**
 * Sentry client-side configuration.
 * Initialised in the browser — captures React render errors, unhandled
 * promise rejections, and any exception passed to Sentry.captureException.
 *
 * Set SENTRY_DSN in .env.local (or your deployment environment) to enable.
 * When SENTRY_DSN is absent Sentry is a no-op and no data is sent.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10 % of sessions for performance tracing.
  // TODO: tune before production launch based on traffic volume.
  tracesSampleRate: 0.1,

  // Only enable the Sentry replay integration in production.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Disable debug output in production.
  debug: false,
});
