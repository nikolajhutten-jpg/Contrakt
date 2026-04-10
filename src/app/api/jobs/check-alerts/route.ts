import { NextRequest } from "next/server";
import { checkAndFireAlerts } from "@/lib/services/alertScheduler";
import { ok, forbidden, handleError } from "@/lib/api/response";

/**
 * POST /api/jobs/check-alerts
 * Called daily by GCP Cloud Scheduler (§8.5).
 * Evaluates all pending notification alerts, fires due email and Slack
 * notifications, and marks them sent.
 *
 * Security: configure Cloud Scheduler to send
 * "Authorization: Bearer <SCHEDULER_SECRET>" and verify it here in production.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const secret = process.env.SCHEDULER_SECRET;
    if (secret) {
      const auth = request.headers.get("authorization");
      if (auth !== `Bearer ${secret}`) return forbidden("Invalid scheduler secret.");
    }

    await checkAndFireAlerts();
    return ok({ fired: true });
  } catch (error) {
    return handleError(error);
  }
}
