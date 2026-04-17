"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface ErrorPageProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

/**
 * Root-level Next.js error page (§14.6).
 * Shown when an uncaught exception escapes a page or layout component.
 * The "Try again" button re-renders the segment via unstable_retry.
 *
 */
export default function ErrorPage({ error, unstable_retry }: ErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 32px", textAlign: "center", background: "#f5f5f7" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
        <svg
          style={{ width: "20px", height: "20px", color: "rgba(0,0,0,0.3)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#171717", letterSpacing: "-0.03em", marginBottom: "8px" }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "24px", maxWidth: "280px" }}>
        Something went wrong. Please try again.
      </p>
      <button
        onClick={unstable_retry}
        style={{
          fontSize: "13px",
          fontWeight: 500,
          padding: "7px 16px",
          background: "#1a7f4b",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          letterSpacing: "-0.01em",
        }}
      >
        Try again
      </button>
    </div>
  );
}
