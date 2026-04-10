"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createDepartment,
  renameDepartment,
  deactivateDepartment,
} from "@/lib/api/departments";
import type { Department } from "@/types";

interface DepartmentListProps {
  initialDepartments: Department[];
}

export default function DepartmentList({ initialDepartments }: DepartmentListProps) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startRename(dept: Department) {
    setRenamingId(dept.id);
    setDraftName(dept.name);
    setError(null);
  }

  function handleRename(id: string) {
    if (!draftName.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const updated = await renameDepartment(id, draftName.trim());
        setDepartments((prev) => prev.map((d) => (d.id === id ? updated : d)));
        setRenamingId(null);
        router.refresh();
      } catch {
        setError("Failed to rename department.");
      }
    });
  }

  function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate "${name}"? It will no longer be available for new contracts.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        const updated = await deactivateDepartment(id);
        setDepartments((prev) => prev.map((d) => (d.id === id ? updated : d)));
        router.refresh();
      } catch {
        setError("Failed to deactivate department.");
      }
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const created = await createDepartment(newName.trim());
        setDepartments((prev) => [...prev, created]);
        setNewName("");
        router.refresh();
      } catch {
        setError("Failed to create department.");
      }
    });
  }

  const active = departments.filter((d) => d.isActive);
  const inactive = departments.filter((d) => !d.isActive);

  return (
    <div className="max-w-lg">
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {/* Active departments */}
      <div className="border border-gray-200 rounded overflow-hidden mb-6">
        {active.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            No departments yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {active.map((dept) => (
              <li key={dept.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                {renamingId === dept.id ? (
                  <>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    <button
                      onClick={() => handleRename(dept.id)}
                      disabled={isPending || !draftName.trim()}
                      className="text-xs font-medium text-gray-900 hover:underline disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-900">{dept.name}</span>
                    <button
                      onClick={() => startRename(dept)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDeactivate(dept.id, dept.name)}
                      disabled={isPending}
                      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add department */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New department name"
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

      {/* Inactive departments (informational) */}
      {inactive.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-400 mb-2">Deactivated</p>
          <ul className="space-y-1">
            {inactive.map((dept) => (
              <li key={dept.id} className="text-sm text-gray-400 line-through">
                {dept.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
