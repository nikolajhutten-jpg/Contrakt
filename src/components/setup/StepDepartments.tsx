"use client";

import { useState, useTransition } from "react";
import type { Department } from "@/types";

const SUGGESTIONS = [
  "Legal",
  "Finance",
  "HR",
  "IT",
  "Engineering",
  "Procurement",
];

interface Props {
  initial: Department[];
  onComplete: (departments: Department[]) => void;
}

export default function StepDepartments({ initial, onComplete }: Props) {
  const [departments, setDepartments] = useState<Department[]>(initial);
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const existingNames = new Set(departments.map((d) => d.name.toLowerCase()));

  async function addDepartment(name: string) {
    const trimmed = name.trim();
    if (!trimmed || existingNames.has(trimmed.toLowerCase())) return;

    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) throw new Error("Failed to create department.");
        const json = (await res.json()) as { data: Department };
        setDepartments((prev) => [...prev, json.data]);
        setCustomName("");
      } catch {
        setError("Failed to create department. Please try again.");
      }
    });
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    void addDepartment(customName);
  }

  return (
    <div>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "16px" }}>
        Add at least one department to continue. You can add more later in
        settings.
      </p>

      {/* Suggestions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {SUGGESTIONS.map((s) => {
          const added = existingNames.has(s.toLowerCase());
          return (
            <button
              key={s}
              type="button"
              disabled={added || isPending}
              onClick={() => void addDepartment(s)}
              style={{
                fontSize: "13px",
                padding: "5px 12px",
                borderRadius: "8px",
                border: added ? "0.5px solid rgba(26,127,75,0.3)" : "0.5px solid rgba(0,0,0,0.12)",
                background: added ? "rgba(26,127,75,0.06)" : "#ffffff",
                color: added ? "#1a7f4b" : "#171717",
                cursor: added || isPending ? "default" : "pointer",
              }}
            >
              {added ? `${s} ✓` : s}
            </button>
          );
        })}
      </div>

      {/* Custom department */}
      <form onSubmit={handleCustomSubmit} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Add a custom department"
          style={{ flex: 1 }}
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={!customName.trim() || isPending}
          style={{
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 14px",
            background: "rgba(0,0,0,0.05)",
            color: "#171717",
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: "8px",
            cursor: (!customName.trim() || isPending) ? "default" : "pointer",
            opacity: (!customName.trim() || isPending) ? 0.4 : 1,
          }}
        >
          Add
        </button>
      </form>

      {error && <p style={{ fontSize: "13px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>}

      {/* Added list */}
      {departments.length > 0 && (
        <ul style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", gap: "4px", listStyle: "none", padding: 0, margin: "0 0 16px 0" }}>
          {departments.map((d) => (
            <li key={d.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1a7f4b", flexShrink: 0, display: "inline-block" }} />
              {d.name}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={departments.length === 0 || isPending}
        onClick={() => onComplete(departments)}
        style={{
          width: "100%",
          fontSize: "13px",
          fontWeight: 500,
          padding: "8px 16px",
          background: "#1a7f4b",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          cursor: (departments.length === 0 || isPending) ? "default" : "pointer",
          opacity: (departments.length === 0 || isPending) ? 0.5 : 1,
          letterSpacing: "-0.01em",
        }}
      >
        Continue
      </button>
    </div>
  );
}
