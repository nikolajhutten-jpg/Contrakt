"use client";

import { useState } from "react";

interface PastDueBannerProps {
  show: boolean;
}

export default function PastDueBanner({ show }: PastDueBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  return (
    <div
      style={{
        background: "#fff8f0",
        borderBottom: "0.5px solid rgba(200, 100, 0, 0.2)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "13px",
        color: "#7a4500",
        flexShrink: 0,
      }}
    >
      <span>
        Your payment is past due. Please{" "}
        <a
          href="/settings/account"
          style={{ color: "#b35900", textDecoration: "underline", fontWeight: 500 }}
        >
          update your billing details
        </a>{" "}
        to avoid losing access.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(122, 69, 0, 0.45)",
          fontSize: "18px",
          lineHeight: 1,
          padding: "0 2px",
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
