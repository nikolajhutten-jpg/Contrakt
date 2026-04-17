"use client";

import { useState, useEffect, useRef } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ExtractionReview from "@/components/upload/ExtractionReview";
import Button from "@/components/ui/Button";
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

function PageHeader() {
  return (
    <div style={{ marginBottom: "32px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "-0.03em", color: "#171717" }}>
        Upload contract
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "4px" }}>
        Upload a PDF or Word document to extract contract details automatically
      </p>
    </div>
  );
}

function PollingDots() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d % 3) + 1), 500);
    return () => clearInterval(t);
  }, []);
  return <span style={{ display: "inline-block", width: "18px" }}>{"·".repeat(dots)}</span>;
}

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

  useEffect(() => {
    if (phase !== "polling" || !jobId) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      if (cancelled) return;

      if (Date.now() - pollStart.current > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        setError({
          message: "Extraction is taking longer than expected. You can wait or fill in the details manually.",
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
          setError({ message: "Automatic extraction failed. Please fill in the details manually.", canRetry: false });
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

    return () => { cancelled = true; clearInterval(timer); };
  }, [phase, jobId]);

  const wrapper = (children: React.ReactNode) => (
    <div style={{ padding: "28px 32px", maxWidth: "1280px" }}>
      <PageHeader />
      {children}
    </div>
  );

  if (phase === "upload") {
    return wrapper(<UploadZone onUpload={handleUploaded} onError={handleUploadError} />);
  }

  if (phase === "polling") {
    return wrapper(
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "64px 0" }}>
        <div
          style={{
            width: "20px",
            height: "20px",
            border: "2px solid rgba(0,0,0,0.1)",
            borderTopColor: "#1a7f4b",
            borderRadius: "50%",
          }}
          className="animate-spin"
        />
        <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.45)" }}>
          Extracting contract details<PollingDots />
        </p>
      </div>,
    );
  }

  if (phase === "error") {
    return wrapper(
      <div style={{ maxWidth: "480px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <p style={{ fontSize: "13px", color: "#c0392b" }}>{error?.message}</p>
        <div style={{ display: "flex", gap: "8px" }}>
          {error?.canRetry && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setPhase("upload"); setError(null); setJobId(null); }}
            >
              Try again
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setResult({ extracted: null, confidence: null, fileName, fileFormat: "" });
              setPhase("review");
              setError(null);
            }}
          >
            Fill in manually
          </Button>
        </div>
      </div>,
    );
  }

  // phase === "review"
  return wrapper(
    <ExtractionReview
      extracted={result?.extracted ?? null}
      confidence={result?.confidence ?? null}
      fileName={result?.fileName ?? fileName}
    />,
  );
}
