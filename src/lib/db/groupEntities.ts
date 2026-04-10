import { db } from "@/lib/db/client";
import type { GroupEntity } from "@/types";

export async function getGroupEntitiesByTenant(
  tenantId: string,
): Promise<GroupEntity[]> {
  return db.groupEntity.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createGroupEntity(
  tenantId: string,
  name: string,
): Promise<GroupEntity> {
  return db.groupEntity.create({ data: { tenantId, name } });
}

export async function deactivateGroupEntity(
  id: string,
  tenantId: string,
): Promise<GroupEntity> {
  return db.groupEntity.update({
    where: { id, tenantId },
    data: { isActive: false },
  });
}
