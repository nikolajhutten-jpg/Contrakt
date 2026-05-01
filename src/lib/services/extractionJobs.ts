/**
 * In-memory extraction job store.
 *
 * Pinned to globalThis for Next.js hot-reload safety in development.
 * In production, replace with a Redis or Cloud Tasks backed store so
 * state survives across Cloud Run instances and process restarts.
 */
import type { ExtractionOutput, ConfidenceRatings } from "@/types";

export type JobStatus = "pending" | "processing" | "complete" | "failed";

export interface ExtractionJob {
  id: string;
  tenantId: string;
  fileName: string;
  fileFormat: string;
  filePath: string | null;
  createdAt: number;
  status: JobStatus;
  extracted: ExtractionOutput | null;
  confidence: ConfidenceRatings | null;
  error: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store: Map<string, ExtractionJob> = (globalThis as any).__extractionJobs ??= new Map();

export function createJob(
  id: string,
  tenantId: string,
  fileName: string,
  fileFormat: string,
  filePath: string | null,
): ExtractionJob {
  const job: ExtractionJob = {
    id,
    tenantId,
    fileName,
    fileFormat,
    filePath,
    createdAt: Date.now(),
    status: "processing",
    extracted: null,
    confidence: null,
    error: null,
  };
  store.set(id, job);
  return job;
}

export function getJob(id: string): ExtractionJob | undefined {
  return store.get(id);
}

export function completeJob(
  id: string,
  extracted: ExtractionOutput,
  confidence: ConfidenceRatings,
): void {
  const job = store.get(id);
  if (!job) return;
  job.status = "complete";
  job.extracted = extracted;
  job.confidence = confidence;
}

export function failJob(id: string, error: string): void {
  const job = store.get(id);
  if (!job) return;
  job.status = "failed";
  job.error = error;
}
