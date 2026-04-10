import { db } from "@/lib/db/client";
import type { Department } from "@/types";

export async function getDepartmentsByTenant(
  tenantId: string,
): Promise<Department[]> {
  return db.department.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

export async function getDepartmentById(
  id: string,
  tenantId: string,
): Promise<Department | null> {
  return db.department.findFirst({ where: { id, tenantId } });
}

export async function createDepartment(
  tenantId: string,
  name: string,
): Promise<Department> {
  return db.department.create({ data: { tenantId, name } });
}

export async function renameDepartment(
  id: string,
  tenantId: string,
  name: string,
): Promise<Department> {
  return db.department.update({ where: { id, tenantId }, data: { name } });
}

/** Soft-deactivates a department; it remains in the database for historical links. */
export async function deactivateDepartment(
  id: string,
  tenantId: string,
): Promise<Department> {
  return db.department.update({
    where: { id, tenantId },
    data: { isActive: false },
  });
}
