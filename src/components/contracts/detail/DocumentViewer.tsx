"use client";

import { useState, useEffect } from "react";
import type { Document } from "@/types";

interface DocumentViewerProps {
  document: Document | null;
}

type ViewerState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "error"; message: string };

export default function DocumentViewer({ document }: DocumentViewerProps) {
  const [state, setState] = useState<ViewerState>({ status: "idle" });

  useEffect(() => {
    if (!document) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });

    fetch(`/api/documents/${document.id}/url`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load document URL.");
        return res.json() as Promise<{ data: { url: string } }>;
      })
      .then(({ data }) => setState({ status: "ready", url: data.url }))
      .catch((err: Error) =>
        setState({ status: "error", message: err.message }),
      );
  }, [document]);

  if (!document) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(0,0,0,0.3)", gap: "12px" }}>
        <svg
          style={{ width: "48px", height: "48px", color: "rgba(0,0,0,0.15)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p style={{ fontSize: "13px" }}>No document selected</p>
      </div>
    );
  }

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(0,0,0,0.35)" }}>
        <p style={{ fontSize: "13px" }}>Loading document…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#c0392b" }}>
        <p style={{ fontSize: "13px" }}>{state.message}</p>
      </div>
    );
  }

  // DOCX files can't be embedded; offer a download link instead
  if (document.fileFormat === "docx") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px", color: "rgba(0,0,0,0.5)" }}>
        <p style={{ fontSize: "13px" }}>Word documents cannot be previewed in-browser.</p>
        <a
          href={state.url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 16px",
            background: "#1a7f4b",
            color: "#ffffff",
            borderRadius: "8px",
            textDecoration: "none",
            letterSpacing: "-0.01em",
          }}
        >
          Download {document.fileName}
        </a>
      </div>
    );
  }

  return (
    <iframe
      src={state.url}
      title={document.fileName}
      style={{
        width: "100%",
        height: "100%",
        border: "0.5px solid rgba(0,0,0,0.1)",
        borderRadius: "12px",
        background: "#ffffff",
        display: "block",
      }}
    />
  );
}
