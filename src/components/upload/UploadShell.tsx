"use client";

import { useState, useEffect, useRef } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ExtractionReview from "@/components/upload/ExtractionReview";
import UploadDocumentViewer from "@/components/upload/UploadDocumentViewer";
import Button from "@/components/ui/Button";
import BackLink from "@/components/ui/BackLink";
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
      <BackLink href="/contracts" />
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const pollStart = useRef<number>(0);

  function handleUploadError(message: string) {
    setError({ message, canRetry: true });
    setPhase("error");
  }

  function handleUploaded(id: string, name: string, file: File) {
    setJobId(id);
    setFileName(name);
    setUploadedFile(file);
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
  return (
    <div className="flex h-full">
      {/* Left pane — document viewer (60%) */}
      <div
        style={{
          flex: "0 0 60%",
          borderRight: "0.5px solid rgba(0,0,0,0.08)",
          background: "#f5f5f7",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header row */}
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
          <BackLink href="/contracts" />
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {uploadedFile ? (
            <UploadDocumentViewer file={uploadedFile} />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "12px",
                color: "rgba(0,0,0,0.3)",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p style={{ fontSize: "13px" }}>No document selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Right pane — extraction review (40%) */}
      <div style={{ flex: "0 0 40%", overflowY: "auto" }}>
        <div style={{ padding: "28px 32px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "-0.03em", color: "#171717", marginBottom: "4px" }}>
            Upload contract
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginBottom: "24px" }}>
            Review and confirm the extracted details
          </p>
          <ExtractionReview
            extracted={result?.extracted ?? null}
            confidence={result?.confidence ?? null}
            fileName={result?.fileName ?? fileName}
          />
        </div>
      </div>
    </div>
  );
}
