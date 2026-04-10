import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { getJob } from "@/lib/services/extractionJobs";
import { ok, notFound, forbidden, handleError } from "@/lib/api/response";

type RouteContext = { params: Promise<{ jobId: string }> };

/**
 * GET /api/upload/[jobId]/status
 * Returns the current extraction job status for polling.
 * Valid statuses: pending | processing | complete | failed
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { tenantId } = await resolveAuthContext();
    const { jobId } = await params;

    const job = getJob(jobId);
    if (!job) return notFound("Job not found.");
    if (job.tenantId !== tenantId) return forbidden();

    return ok({ status: job.status, error: job.error });
  } catch (error) {
    return handleError(error);
  }
}
