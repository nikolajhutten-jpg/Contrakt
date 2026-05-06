"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDepartment, renameDepartment, deactivateDepartment } from "@/lib/api/departments";
import Modal from "@/components/ui/Modal";
import type { Department } from "@/types";

interface DepartmentListProps {
  initialDepartments: Department[];
}

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "0 16px",
  height: "40px",
  borderBottom: "0.5px solid rgba(0,0,0,0.05)",
};

const ACTION_BTN: React.CSSProperties = {
  fontSize: "12px",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  flexShrink: 0,
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.35)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  padding: "10px 16px 6px",
};

export default function DepartmentList({ initialDepartments }: DepartmentListProps) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<{ id: string; name: string } | null>(null);

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
    setPendingDeactivate({ id, name });
  }

  function confirmDeactivate() {
    const id = pendingDeactivate?.id;
    if (!id) return;
    setPendingDeactivate(null);
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
    <div>
      {error && <p style={{ fontSize: "12px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>}

      <div style={{ background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", overflow: "hidden" }}>
        {active.length === 0 ? (
          <p style={{ padding: "32px 16px", textAlign: "center", fontSize: "13px", color: "rgba(0,0,0,0.35)" }}>
            No departments yet.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {active.map((dept) => (
              <li key={dept.id} className="group" style={ROW_STYLE}>
                {renamingId === dept.id ? (
                  <>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      autoFocus
                      style={{ flex: 1, height: "28px", fontSize: "13px" }}
                    />
                    <button
                      onClick={() => handleRename(dept.id)}
                      disabled={isPending || !draftName.trim()}
                      style={{ ...ACTION_BTN, color: "#1a1a1a", fontWeight: 500, opacity: (isPending || !draftName.trim()) ? 0.4 : 1 }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      style={{ ...ACTION_BTN, color: "rgba(0,0,0,0.35)" }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "#171717" }}>
                      {dept.name}
                    </span>
                    <button
                      onClick={() => startRename(dept)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ ...ACTION_BTN, color: "rgba(0,0,0,0.4)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#171717"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"; }}
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDeactivate(dept.id, dept.name)}
                      disabled={isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ ...ACTION_BTN, color: "rgba(0,0,0,0.4)", opacity: isPending ? 0.4 : undefined }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c0392b"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"; }}
                    >
                      Deactivate
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {inactive.length > 0 && (
          <>
            <div style={SECTION_LABEL}>Inactive</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {inactive.map((dept) => (
                <li key={dept.id} style={{ ...ROW_STYLE, borderBottom: "none" }}>
                  <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.3)", textDecoration: "line-through" }}>
                    {dept.name}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

      <Modal
        isOpen={!!pendingDeactivate}
        title={`Deactivate "${pendingDeactivate?.name}"?`}
        body="It will no longer be available for new contracts."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={confirmDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderTop: "0.5px solid rgba(0,0,0,0.08)" }}
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New department name"
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
