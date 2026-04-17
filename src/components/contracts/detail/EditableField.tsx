"use client";

import { useState, useTransition } from "react";

interface Option {
  value: string;
  label: string;
}

interface EditableFieldProps {
  label: string;
  value: string | boolean;
  /** Shown in read mode. Falls back to value for strings, "Yes"/"No" for booleans. */
  displayValue?: string;
  inputType?: "text" | "date" | "number" | "select" | "toggle";
  options?: Option[];
  onSave: (next: string | boolean) => Promise<void>;
}

const LABEL_STYLE: React.CSSProperties = {
  width: "40%",
  flexShrink: 0,
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.4)",
  paddingTop: "1px",
};

export default function EditableField({
  label,
  value,
  displayValue,
  inputType = "text",
  options = [],
  onSave,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | boolean>(value);
  const [pending, startTransition] = useTransition();

  function open() {
    setDraft(value);
    setEditing(true);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      await onSave(draft);
      setEditing(false);
    });
  }

  const shown =
    displayValue ??
    (typeof value === "boolean" ? (value ? "Yes" : "No") : value || "—");

  if (!editing) {
    return (
      <div
        className="prop-row group"
        style={{ alignItems: "center" }}
      >
        <dt style={LABEL_STYLE}>{label}</dt>
        <dd
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: "13px", color: "#171717" }}>{shown}</span>
          <button
            onClick={open}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              fontSize: "11px",
              color: "rgba(0,0,0,0.35)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#1a7f4b";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.35)";
            }}
          >
            Edit
          </button>
        </dd>
      </div>
    );
  }

  return (
    <div className="prop-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <dt style={{ ...LABEL_STYLE, width: "auto", marginBottom: "6px" }}>{label}</dt>
      <dd style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {inputType === "toggle" ? (
          <div style={{ display: "flex", gap: "4px" }}>
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setDraft(v)}
                style={{
                  padding: "3px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  borderRadius: "20px",
                  border: "0.5px solid rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  background: draft === v ? "#1a7f4b" : "rgba(0,0,0,0.05)",
                  color: draft === v ? "#ffffff" : "rgba(0,0,0,0.5)",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {v ? "Yes" : "No"}
              </button>
            ))}
          </div>
        ) : inputType === "select" ? (
          <select
            value={draft as string}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            style={{ flex: 1, height: "30px", fontSize: "13px" }}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            value={draft as string}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            style={{ flex: 1, height: "30px", fontSize: "13px" }}
          />
        )}
        <button
          onClick={handleSave}
          disabled={pending}
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: pending ? "rgba(0,0,0,0.3)" : "#1a7f4b",
            background: "none",
            border: "none",
            cursor: pending ? "default" : "pointer",
            padding: 0,
            flexShrink: 0,
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={cancel}
          style={{
            fontSize: "12px",
            color: "rgba(0,0,0,0.35)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
          }}
        >
          Cancel
        </button>
      </dd>
    </div>
  );
}
