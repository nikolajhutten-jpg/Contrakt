import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { getJob } from "@/lib/services/extractionJobs";
import { ok, notFound, forbidden, badRequest, handleError } from "@/lib/api/response";

type RouteContext = { params: Promise<{ jobId: string }> };

/**
 * GET /api/upload/[jobId]/result
 * Returns the extraction output once the job is complete.
 * Callers should verify status = "complete" before fetching this endpoint.
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
    if (job.status !== "complete") {
      return badRequest("Extraction is not yet complete.");
    }

    return ok({
      extracted: job.extracted,
      confidence: job.confidence,
      fileName: job.fileName,
      fileFormat: job.fileFormat,
    });
  } catch (error) {
    return handleError(error);
  }
}
