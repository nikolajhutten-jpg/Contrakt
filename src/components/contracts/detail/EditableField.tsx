"use client";

import { useState, useTransition } from "react";

interface EditableFieldProps {
  label: string;
  value: string;
  inputType?: "text" | "date" | "number";
  onSave: (next: string) => Promise<void>;
}

export default function EditableField({
  label,
  value,
  inputType = "text",
  onSave,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await onSave(draft);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div className="py-3 border-b border-gray-100 last:border-0 group flex items-start justify-between gap-2">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-gray-400 mb-0.5">{label}</dt>
          <dd className="text-sm text-gray-900">{value || "—"}</dd>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-gray-600 transition-opacity flex-shrink-0 mt-4"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-400 mb-1">{label}</dt>
      <div className="flex items-center gap-2">
        <input
          type={inputType}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-2.5 py-1 text-xs font-medium bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setDraft(value);
            setEditing(false);
          }}
          className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
