"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";

interface Props {
  onComplete: (orgName: string) => void;
}

const FIELD_LABEL: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#171717",
  marginBottom: "4px",
};

export default function StepOrganisation({ onComplete }: Props) {
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: orgName.trim() }),
        });
        if (!res.ok) throw new Error("Failed to save.");
        onComplete(orgName.trim());
      } catch {
        setError("Failed to save. Please try again.");
      }
    });
  }

  return (
    <div>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "16px" }}>
        This is how your workspace will appear to your team.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={FIELD_LABEL}>What&apos;s your organisation called?</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Acme Corp"
            disabled={isPending}
            autoFocus
          />
        </div>
        {error && <p style={{ fontSize: "13px", color: "#c0392b" }}>{error}</p>}
        <Button
          type="submit"
          variant="primary"
          disabled={!orgName.trim() || isPending}
          style={{ width: "100%", padding: "8px 16px" }}
        >
          {isPending ? "Saving…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
