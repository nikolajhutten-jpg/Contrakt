"use client";

import { useState, useEffect } from "react";

interface UploadDocumentViewerProps {
  file: File;
}

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function UploadDocumentViewer({ file }: UploadDocumentViewerProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const isDocx = file.type === DOCX_TYPE || file.name.toLowerCase().endsWith(".docx");

  useEffect(() => {
    if (isDocx) return;
    const reader = new FileReader();
    reader.onload = () => setDataUrl(reader.result as string);
    reader.readAsDataURL(file);
    return () => { reader.abort(); };
  }, [file, isDocx]);

  if (isDocx) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "12px",
          color: "rgba(0,0,0,0.35)",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "rgba(0,0,0,0.4)" }}>
          Preview not available for Word documents
        </p>
        <p style={{ fontSize: "12px", color: "rgba(0,0,0,0.3)" }}>{file.name}</p>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "rgba(0,0,0,0.3)",
          fontSize: "13px",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <iframe
      src={dataUrl}
      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
      title={file.name}
    />
  );
}
