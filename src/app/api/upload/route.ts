import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { resolveAuthContext } from "@/lib/auth/session";
import { createJob, completeJob, failJob } from "@/lib/services/extractionJobs";
import { convertToText, extractContractProperties, handleExtractionFailure } from "@/lib/services/extraction";
import { ok, badRequest, handleError } from "@/lib/api/response";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — §14.1
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const FORMAT_NAMES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/**
 * Runs the full extraction pipeline for a job: text conversion → Claude API.
 * Marks the job complete or failed when done.
 * Runs fire-and-forget after the HTTP response is returned.
 *
 * §14.1: scanned image PDFs (no text layer) → §12.6 all-null result, job complete.
 * §12.6: Claude malformed JSON / timeout → all-null result, job complete.
 */
async function runExtractionPipeline(
  jobId: string,
  buffer: Buffer,
  fileFormat: string,
): Promise<void> {
  let text: string;
  try {
    text = await convertToText(buffer, fileFormat);
  } catch {
    // §14.1 — scanned image or unreadable file: fall through to manual entry
    const { extracted, confidence } = handleExtractionFailure();
    completeJob(jobId, extracted, confidence);
    return;
  }

  try {
    const { extracted, confidence } = await extractContractProperties(text);
    completeJob(jobId, extracted, confidence);
  } catch {
    // Unexpected error in extraction — mark failed so UI shows retry option
    failJob(jobId, "Automatic extraction failed. Please fill in the details manually.");
  }
}

/**
 * POST /api/upload
 * Validates format (PDF/DOCX) and size (≤ 25 MB), creates an extraction job,
 * fires the extraction pipeline in the background, and returns the jobId immediately.
 *
 * GCS upload is a placeholder — the buffer is read into memory only.
 * Wire in GCS upload before the extraction call in production.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { tenantId } = await resolveAuthContext();

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return badRequest("Request must be multipart/form-data.");
    }

    const file = formData.get("file");
    if (!(file instanceof File)) return badRequest("A file field is required.");

    // §14.1 — format check
    if (!ALLOWED_TYPES.has(file.type)) {
      return badRequest("Only PDF and DOCX files are supported.");
    }

    // §14.1 — size check
    if (file.size > MAX_BYTES) {
      return badRequest("This file is too large. Maximum file size is 25MB.");
    }

    const fileFormat = FORMAT_NAMES[file.type];
    const jobId = randomUUID();

    // TODO: upload buffer to GCS before extraction
    // const filePath = await uploadToGcs(tenantId, file.name, buffer);
    const buffer = Buffer.from(await file.arrayBuffer());

    createJob(jobId, tenantId, file.name, fileFormat);

    // Fire-and-forget — response is returned immediately; pipeline runs in background
    void runExtractionPipeline(jobId, buffer, fileFormat);

    return ok({ jobId, fileName: file.name, fileFormat });
  } catch (error) {
    return handleError(error);
  }
}
