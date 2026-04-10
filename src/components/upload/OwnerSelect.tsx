"use client";

import { useState, useRef, useEffect } from "react";
import type { User } from "@/types";

interface OwnerSelectProps {
  users: User[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function OwnerSelect({ users, selected, onChange }: OwnerSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedUsers = users.filter((u) => selected.includes(u.id));
  const filtered = users.filter(
    (u) =>
      !selected.includes(u.id) &&
      u.name.toLowerCase().includes(query.toLowerCase()),
  );

  function add(id: string) {
    onChange([...selected, id]);
    setQuery("");
  }

  function remove(id: string) {
    onChange(selected.filter((x) => x !== id));
  }

  const inputCls =
    "w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400";

  return (
    <div ref={containerRef} className="relative">
      {/* Selected pills */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedUsers.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {u.name}
              <button
                type="button"
                onClick={() => remove(u.id)}
                className="text-gray-400 hover:text-gray-600 leading-none"
                aria-label={`Remove ${u.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Text input */}
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={selectedUsers.length === 0 ? "Search owners…" : "Add another owner…"}
        className={inputCls}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-sm max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">
              {users.length === 0 ? "No users found." : "No matches."}
            </p>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => { add(u.id); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {u.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
