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

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Selected pills */}
      {selectedUsers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
          {selectedUsers.map((u) => (
            <span
              key={u.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                fontSize: "12px",
                background: "rgba(0,0,0,0.06)",
                color: "#171717",
                borderRadius: "20px",
              }}
            >
              {u.name}
              <button
                type="button"
                onClick={() => remove(u.id)}
                aria-label={`Remove ${u.name}`}
                style={{
                  color: "rgba(0,0,0,0.35)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 0,
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c0392b"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.35)"; }}
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
      />

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          zIndex: 10,
          marginTop: "4px",
          width: "100%",
          background: "#ffffff",
          border: "0.5px solid rgba(0,0,0,0.1)",
          borderRadius: "8px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          maxHeight: "192px",
          overflowY: "auto",
        }}>
          {filtered.length === 0 ? (
            <p style={{ padding: "8px 12px", fontSize: "12px", color: "rgba(0,0,0,0.35)" }}>
              {users.length === 0 ? "No users found." : "No matches."}
            </p>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => { add(u.id); setOpen(false); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: "13px",
                  color: "#171717",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "block",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
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
