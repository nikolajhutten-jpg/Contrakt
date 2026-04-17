"use client";

import { useState, useTransition } from "react";
import OwnerSelect from "@/components/upload/OwnerSelect";
import type { User } from "@/types";

interface EditableOwnersFieldProps {
  ownerIds: string[];
  displayValue: string;
  users: User[];
  onSave: (ids: string[]) => Promise<void>;
}

const LABEL_STYLE: React.CSSProperties = {
  width: "40%",
  flexShrink: 0,
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.4)",
  paddingTop: "1px",
};

export default function EditableOwnersField({
  ownerIds,
  displayValue,
  users,
  onSave,
}: EditableOwnersFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(ownerIds);
  const [pending, startTransition] = useTransition();

  function open() {
    setDraft(ownerIds);
    setEditing(true);
  }

  function handleSave() {
    startTransition(async () => {
      await onSave(draft);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div className="prop-row group" style={{ alignItems: "center" }}>
        <dt style={LABEL_STYLE}>Business owners</dt>
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
          <span style={{ fontSize: "13px", color: "#171717" }}>{displayValue || "—"}</span>
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
      <dt style={{ ...LABEL_STYLE, width: "auto", marginBottom: "6px" }}>Business owners</dt>
      <dd>
        <OwnerSelect users={users} selected={draft} onChange={setDraft} />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
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
            }}
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => { setDraft(ownerIds); setEditing(false); }}
            style={{
              fontSize: "12px",
              color: "rgba(0,0,0,0.35)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Cancel
          </button>
        </div>
      </dd>
    </div>
  );
}
