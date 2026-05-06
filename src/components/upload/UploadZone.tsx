"use client";

import { useState, useRef, useCallback } from "react";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadZoneProps {
  onUpload: (jobId: string, fileName: string, file: File) => void;
  onError: (message: string) => void;
}

export default function UploadZone({ onUpload, onError }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(f: File): string | null {
    if (!ALLOWED_TYPES.has(f.type)) return "Only PDF and DOCX files are supported.";
    if (f.size > MAX_BYTES) return "This file is too large. Maximum file size is 25 MB.";
    return null;
  }

  function pick(f: File) {
    const err = validate(f);
    setValidationError(err);
    setFile(err ? null : f);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) pick(dropped);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (!file) return;
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json() as { data?: { jobId: string; fileName: string }; error?: string };
      if (!res.ok) {
        onError(json.error ?? "Upload failed. Please try again.");
        return;
      }
      onUpload(json.data!.jobId, json.data!.fileName, file);
    } catch {
      onError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          background: dragOver ? "rgba(0,0,0,0.02)" : "#ffffff",
          border: `0.5px dashed ${dragOver ? "#1a1a1a" : "rgba(0,0,0,0.2)"}`,
          borderRadius: "12px",
          padding: "48px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
          userSelect: "none",
        }}
      >
        {/* Upload icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>

        <p style={{ fontSize: "15px", fontWeight: 500, color: "#171717", marginTop: "12px" }}>
          Drop your contract here
        </p>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "4px" }}>
          or click to browse — PDF or DOCX up to 20 MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }}
        />
      </div>

      {/* Selected file pill */}
      {file && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "12px",
            padding: "3px 10px 3px 12px",
            background: "rgba(0,0,0,0.06)",
            borderRadius: "20px",
            fontSize: "12px",
            color: "#171717",
            maxWidth: "100%",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.name}
          </span>
          <span style={{ color: "rgba(0,0,0,0.4)", flexShrink: 0 }}>{formatBytes(file.size)}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setFile(null); setValidationError(null); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 2px",
              color: "rgba(0,0,0,0.35)",
              fontSize: "14px",
              lineHeight: 1,
              flexShrink: 0,
            }}
            aria-label="Clear file"
          >
            ×
          </button>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <p style={{ fontSize: "13px", color: "#c0392b", marginTop: "8px" }}>{validationError}</p>
      )}

      {/* Upload button */}
      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        style={{
          display: "block",
          width: "100%",
          marginTop: "16px",
          padding: "8px 0",
          background: "rgba(0,0,0,0.05)",
          color: "#171717",
          fontSize: "13px",
          fontWeight: 500,
          border: "0.5px solid rgba(0,0,0,0.1)",
          borderRadius: "8px",
          cursor: file && !uploading ? "pointer" : "not-allowed",
          opacity: !file || uploading ? 0.4 : 1,
          transition: "opacity 0.15s",
          letterSpacing: "-0.01em",
        }}
      >
        {uploading ? "Uploading…" : "Upload and extract"}
      </button>
    </div>
  );
}
