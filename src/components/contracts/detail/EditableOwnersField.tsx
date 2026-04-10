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
      <div className="py-3 border-b border-gray-100 last:border-0 group flex items-start justify-between gap-2">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-gray-400 mb-0.5">Business owners</dt>
          <dd className="text-sm text-gray-900">{displayValue || "—"}</dd>
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
      <dt className="text-xs font-medium text-gray-400 mb-1">Business owners</dt>
      <OwnerSelect users={users} selected={draft} onChange={setDraft} />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-2.5 py-1 text-xs font-medium bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { setDraft(ownerIds); setEditing(false); }}
          className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
