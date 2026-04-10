"use client";

import { useState, useTransition } from "react";
import type { Department } from "@/types";

const SUGGESTIONS = [
  "Legal",
  "Finance",
  "HR",
  "IT",
  "Engineering",
  "Procurement",
];

interface Props {
  initial: Department[];
  onComplete: (departments: Department[]) => void;
}

export default function StepDepartments({ initial, onComplete }: Props) {
  const [departments, setDepartments] = useState<Department[]>(initial);
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const existingNames = new Set(departments.map((d) => d.name.toLowerCase()));

  async function addDepartment(name: string) {
    const trimmed = name.trim();
    if (!trimmed || existingNames.has(trimmed.toLowerCase())) return;

    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) throw new Error("Failed to create department.");
        const json = (await res.json()) as { data: Department };
        setDepartments((prev) => [...prev, json.data]);
        setCustomName("");
      } catch {
        setError("Failed to create department. Please try again.");
      }
    });
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    void addDepartment(customName);
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Add at least one department to continue. You can add more later in
        settings.
      </p>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGESTIONS.map((s) => {
          const added = existingNames.has(s.toLowerCase());
          return (
            <button
              key={s}
              type="button"
              disabled={added || isPending}
              onClick={() => void addDepartment(s)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                added
                  ? "border-green-300 bg-green-50 text-green-700 cursor-default"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900"
              }`}
            >
              {added ? `${s} ✓` : s}
            </button>
          );
        })}
      </div>

      {/* Custom department */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Add a custom department"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={!customName.trim() || isPending}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Added list */}
      {departments.length > 0 && (
        <ul className="text-sm text-gray-600 space-y-1 mb-4">
          {departments.map((d) => (
            <li key={d.id} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              {d.name}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={departments.length === 0 || isPending}
        onClick={() => onComplete(departments)}
        className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
