"use client";

import Button from "@/components/ui/Button";

interface EmptyStateProps {
  heading: string;
  subtext: string;
  actionLabel: string;
  onAction: () => void;
}

/**
 * Full-page empty state shown when a list has no items (§14.6).
 * Never shows a blank screen — always provides a clear call-to-action.
 */
export default function EmptyState({
  heading,
  subtext,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: "12px",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "rgba(0,0,0,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      </div>

      <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#171717", marginBottom: "4px" }}>
        {heading}
      </h3>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", maxWidth: "280px", lineHeight: 1.5 }}>
        {subtext}
      </p>

      <div style={{ marginTop: "20px" }}>
        <Button onClick={onAction}>{actionLabel}</Button>
      </div>
    </div>
  );
}
