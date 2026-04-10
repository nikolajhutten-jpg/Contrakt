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
  onUpload: (jobId: string, fileName: string) => void;
  onError: (message: string) => void;
}

export default function UploadZone({ onUpload, onError }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(f: File): string | null {
    if (!ALLOWED_TYPES.has(f.type)) {
      return "Only PDF and DOCX files are supported.";
    }
    if (f.size > MAX_BYTES) {
      return "This file is too large. Maximum file size is 25MB.";
    }
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
      onUpload(json.data!.jobId, json.data!.fileName);
    } catch {
      onError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded cursor-pointer p-12 flex flex-col items-center gap-3 transition-colors ${
          dragOver
            ? "border-gray-400 bg-gray-50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium text-gray-700">
          Drag and drop your contract here
        </p>
        <p className="text-xs text-gray-400">PDF or DOCX · up to 25 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }}
        />
      </div>

      {/* Selected file */}
      {file && (
        <div className="mt-3 flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm">
          <span className="text-gray-700 truncate">{file.name}</span>
          <span className="text-gray-400 flex-shrink-0">{formatBytes(file.size)}</span>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <p className="mt-2 text-sm text-red-600">{validationError}</p>
      )}

      {/* Upload button */}
      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        className="mt-4 w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? "Uploading…" : "Upload and extract"}
      </button>
    </div>
  );
}
