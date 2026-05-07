import { NextRequest, NextResponse } from "next/server";
import { updateContractStatuses } from "@/lib/services/statusUpdater";
import { ok, forbidden, handleError } from "@/lib/api/response";

/**
 * POST /api/jobs/update-statuses
 * Called daily by GCP Cloud Scheduler (§8.5).
 * Applies automatic contract status transitions:
 *   Active → Action Required when renewal notice deadline is reached.
 *   Active | Action Required → Expired when end date passes with no action confirmed.
 *
 * Security: configure Cloud Scheduler to send
 * "Authorization: Bearer <SCHEDULER_SECRET>" and verify it here in production.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const secret = process.env.SCHEDULER_SECRET;
    if (!secret) {
      console.error("SCHEDULER_SECRET is not configured.");
      return NextResponse.json({ error: "Scheduler not configured." }, { status: 500 });
    }

    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return forbidden("Invalid scheduler secret.");

    await updateContractStatuses();
    return ok({ updated: true });
  } catch (error) {
    return handleError(error);
  }
}
