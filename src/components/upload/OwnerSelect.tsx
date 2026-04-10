"use client";

import type { User } from "@/types";

interface OwnerSelectProps {
  users: User[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function OwnerSelect({ users, selected, onChange }: OwnerSelectProps) {
  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
    );
  }

  if (users.length === 0) {
    return <p className="text-xs text-gray-400">No users found.</p>;
  }

  return (
    <div className="space-y-1.5 max-h-36 overflow-y-auto">
      {users.map((u) => (
        <label key={u.id} className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={selected.includes(u.id)}
            onChange={() => toggle(u.id)}
            className="rounded border-gray-300"
          />
          {u.name}
          <span className="text-gray-400 text-xs">({u.role})</span>
        </label>
      ))}
    </div>
  );
}
