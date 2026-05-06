/**
 * POST /api/jobs/check-alerts
 * DEPRECATED: This endpoint was called by GCP Cloud Scheduler (§8.5).
 * Alert scheduling has been replaced by the Vercel cron job at
 * GET /api/cron/alerts (schedule: 0 8 * * *). This route is kept for
 * reference but is no longer active.
 */
export async function POST(): Promise<Response> {
  return new Response(
    JSON.stringify({
      error: "Gone",
      message:
        "This endpoint has been retired. Alert scheduling is now handled by the Vercel cron job at GET /api/cron/alerts.",
    }),
    { status: 410, headers: { "Content-Type": "application/json" } },
  );
}
