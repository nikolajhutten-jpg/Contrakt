/**
 * Client-side API helpers for department operations.
 */
import type { Department } from "@/types";

export async function createDepartment(name: string): Promise<Department> {
  const res = await fetch("/api/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create department.");
  return res.json() as Promise<Department>;
}

export async function renameDepartment(
  id: string,
  name: string,
): Promise<Department> {
  const res = await fetch(`/api/departments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to rename department.");
  return res.json() as Promise<Department>;
}

export async function deactivateDepartment(id: string): Promise<Department> {
  const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to deactivate department.");
  return res.json() as Promise<Department>;
}
