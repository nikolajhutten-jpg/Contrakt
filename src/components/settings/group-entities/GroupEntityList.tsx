"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GroupEntity } from "@/types";

interface GroupEntityListProps {
  initialEntities: GroupEntity[];
}

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "0 16px",
  height: "40px",
  borderBottom: "0.5px solid rgba(0,0,0,0.05)",
};

export default function GroupEntityList({ initialEntities }: GroupEntityListProps) {
  const router = useRouter();
  const [entities, setEntities] = useState(initialEntities);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/group-entities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName.trim() }),
        });
        const json = await res.json() as { data?: GroupEntity; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to create group entity.");
        setEntities((prev) => [...prev, json.data!]);
        setNewName("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create group entity.");
      }
    });
  }

  function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate "${name}"? It will no longer be available for new contracts.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/group-entities/${id}`, { method: "DELETE" });
        const json = await res.json() as { data?: GroupEntity; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to deactivate group entity.");
        setEntities((prev) => prev.filter((e) => e.id !== id));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to deactivate group entity.");
      }
    });
  }

  return (
    <div>
      {error && <p style={{ fontSize: "12px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>}

      <div style={{ background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", overflow: "hidden" }}>
        {entities.length === 0 ? (
          <p style={{ padding: "32px 16px", textAlign: "center", fontSize: "13px", color: "rgba(0,0,0,0.35)" }}>
            No group entities yet.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {entities.map((entity) => (
              <li key={entity.id} className="group" style={ROW_STYLE}>
                <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "#171717" }}>
                  {entity.name}
                </span>
                <button
                  onClick={() => handleDeactivate(entity.id, entity.name)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    fontSize: "12px",
                    color: "rgba(0,0,0,0.4)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c0392b"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"; }}
                >
                  Deactivate
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderTop: "0.5px solid rgba(0,0,0,0.08)" }}
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New group entity name"
            style={{ flex: 1, height: "30px", fontSize: "13px" }}
          />
          <button
            type="submit"
            disabled={isPending || !newName.trim()}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              padding: "5px 12px",
              background: "rgba(0,0,0,0.05)",
              color: "#171717",
              border: "0.5px solid rgba(0,0,0,0.1)",
              borderRadius: "8px",
              cursor: (isPending || !newName.trim()) ? "default" : "pointer",
              opacity: (isPending || !newName.trim()) ? 0.4 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {isPending ? "Adding…" : "Add"}
          </button>
        </form>
      </div>
    </div>
  );
}
