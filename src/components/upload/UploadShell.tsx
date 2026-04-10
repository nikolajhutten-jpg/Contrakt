"use client";

import { useState, useEffect, useRef } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ExtractionReview from "@/components/upload/ExtractionReview";
import type { ExtractionOutput, ConfidenceRatings } from "@/types";

type Phase = "upload" | "polling" | "review" | "error";

interface JobResult {
  extracted: ExtractionOutput | null;
  confidence: ConfidenceRatings | null;
  fileName: string;
  fileFormat: string;
}

interface ErrorState {
  message: string;
  canRetry: boolean;
}

const POLL_MS = 2_000;
const POLL_TIMEOUT_MS = 60_000;

export default function UploadShell() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [jobId, setJobId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const pollStart = useRef<number>(0);

  function handleUploadError(message: string) {
    setError({ message, canRetry: true });
    setPhase("error");
  }

  function handleUploaded(id: string, name: string) {
    setJobId(id);
    setFileName(name);
    pollStart.current = Date.now();
    setPhase("polling");
  }

  // Poll the status endpoint until complete or failed
  useEffect(() => {
    if (phase !== "polling" || !jobId) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      if (cancelled) return;

      if (Date.now() - pollStart.current > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        setError({
          message:
            "Extraction is taking longer than expected. You can wait or fill in the details manually.",
          canRetry: true,
        });
        setPhase("error");
        return;
      }

      try {
        const statusRes = await fetch(`/api/upload/${jobId}/status`);
        const statusJson = await statusRes.json() as { data?: { status: string; error?: string } };
        const status = statusJson.data?.status;

        if (status === "failed") {
          clearInterval(timer);
          setError({
            message:
              "Automatic extraction failed. Please fill in the details manually.",
            canRetry: false,
          });
          setPhase("error");
          return;
        }

        if (status === "complete") {
          clearInterval(timer);
          const resultRes = await fetch(`/api/upload/${jobId}/result`);
          const resultJson = await resultRes.json() as { data?: JobResult };
          setResult(resultJson.data ?? null);
          setPhase("review");
        }
      } catch {
        // Network blip — keep polling
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [phase, jobId]);

  if (phase === "upload") {
    return (
      <div className="px-8 py-6 max-w-screen-xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Upload contract</h1>
        <UploadZone onUpload={handleUploaded} onError={handleUploadError} />
      </div>
    );
  }

  if (phase === "polling") {
    return (
      <div className="px-8 py-6 max-w-screen-xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Upload contract</h1>
        <div className="max-w-xl mx-auto flex flex-col items-center gap-4 py-16 text-gray-500">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm">Analyzing {fileName}…</p>
          <p className="text-xs text-gray-400">This usually takes a few seconds.</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="px-8 py-6 max-w-screen-xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Upload contract</h1>
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-sm text-red-600">{error?.message}</p>
          <div className="flex gap-3">
            {error?.canRetry && (
              <button
                onClick={() => { setPhase("upload"); setError(null); setJobId(null); }}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Try again
              </button>
            )}
            {/* Manual fallback — proceed to review with null extraction */}
            <button
              onClick={() => {
                setResult({ extracted: null, confidence: null, fileName, fileFormat: "" });
                setPhase("review");
                setError(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Fill in manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  // phase === "review"
  return (
    <div className="px-8 py-6 max-w-screen-xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Upload contract</h1>
      <ExtractionReview
        extracted={result?.extracted ?? null}
        confidence={result?.confidence ?? null}
        fileName={result?.fileName ?? fileName}
      />
    </div>
  );
}
