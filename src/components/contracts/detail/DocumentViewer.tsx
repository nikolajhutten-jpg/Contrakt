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
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <svg
          className="w-12 h-12 text-gray-300"
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
        <p className="text-sm">No document selected</p>
      </div>
    );
  }

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-sm">Loading document…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p className="text-sm">{state.message}</p>
      </div>
    );
  }

  // DOCX files can't be embedded; offer a download link instead
  if (document.fileFormat === "docx") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
        <p className="text-sm">Word documents cannot be previewed in-browser.</p>
        <a
          href={state.url}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
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
      className="w-full h-full border-0"
    />
  );
}
