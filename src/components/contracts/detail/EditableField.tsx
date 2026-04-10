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

  const inputCls =
    "flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400";

  if (!editing) {
    return (
      <div className="py-3 border-b border-gray-100 last:border-0 group flex items-start justify-between gap-2">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-gray-400 mb-0.5">{label}</dt>
          <dd className="text-sm text-gray-900">{shown}</dd>
        </div>
        <button
          onClick={open}
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
        {inputType === "toggle" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDraft(true)}
              className={`px-4 py-1.5 text-sm rounded border transition-colors ${
                draft === true
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setDraft(false)}
              className={`px-4 py-1.5 text-sm rounded border transition-colors ${
                draft === false
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              No
            </button>
          </div>
        ) : inputType === "select" ? (
          <select
            value={draft as string}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className={inputCls}
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
            className={inputCls}
          />
        )}
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-2.5 py-1 text-xs font-medium bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={cancel}
          className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
