"use client";

import { useState, useTransition } from "react";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  team: "Team",
  business: "Business",
};

interface Props {
  orgName: string;
  plan: string;
  departmentCount: number;
  onComplete: () => void;
  onBack: () => void;
}

export default function StepConfirm({ orgName, plan, departmentCount, onComplete, onBack }: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/setup/complete", { method: "PATCH" });
        if (!res.ok) throw new Error("Failed to complete setup.");
        onComplete();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  const ROW: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const DIVIDER: React.CSSProperties = {
    height: "0.5px",
    background: "rgba(0,0,0,0.06)",
  };

  return (
    <div>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "20px" }}>
        Review your setup before getting started.
      </p>

      <div style={{ marginBottom: "24px", padding: "14px 16px", background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={ROW}>
          <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)" }}>Organisation</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#171717" }}>{orgName}</span>
        </div>
        <div style={DIVIDER} />
        <div style={ROW}>
          <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)" }}>Plan</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#171717" }}>{PLAN_LABELS[plan] ?? plan}</span>
        </div>
        <div style={DIVIDER} />
        <div style={ROW}>
          <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)" }}>Departments</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#171717" }}>{departmentCount}</span>
        </div>
      </div>

      {error && <p style={{ fontSize: "13px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button
          type="button"
          disabled={isPending}
          onClick={handleConfirm}
          style={{
            width: "100%",
            fontSize: "13px",
            fontWeight: 500,
            padding: "8px 16px",
            background: "#1a1a1a",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: isPending ? "default" : "pointer",
            opacity: isPending ? 0.5 : 1,
            letterSpacing: "-0.01em",
          }}
        >
          {isPending ? "Setting up…" : "Confirm and get started"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          style={{
            fontSize: "13px",
            color: "rgba(0,0,0,0.4)",
            background: "none",
            border: "none",
            cursor: isPending ? "default" : "pointer",
            padding: "4px 0",
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
