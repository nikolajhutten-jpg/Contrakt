"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GroupEntity } from "@/types";

interface GroupEntityListProps {
  initialEntities: GroupEntity[];
}

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
    <div className="max-w-lg">
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <div className="border border-gray-200 rounded overflow-hidden mb-6">
        {entities.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            No group entities yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {entities.map((entity) => (
              <li key={entity.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                <span className="flex-1 text-sm text-gray-900">{entity.name}</span>
                <button
                  onClick={() => handleDeactivate(entity.id, entity.name)}
                  disabled={isPending}
                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Deactivate
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New group entity name"
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={isPending || !newName.trim()}
          className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </form>
    </div>
  );
}
