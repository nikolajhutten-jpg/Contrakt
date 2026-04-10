/**
 * Shared helpers used by both contracts.ts and dashboard.ts.
 * Kept in a separate file so neither module exceeds 200 lines.
 */
import { UserRole, ContractStatus } from "@/types";
import type { ContractSummary } from "@/types";

export interface RoleContext {
  role: string;
  userId: string;
  departmentId: string | null;
  tenantId: string;
}

/** Role-aware Prisma WHERE clause applied to every contract query. */
export function contractWhere(ctx: RoleContext) {
  const { role, userId, departmentId, tenantId } = ctx;
  if (role === UserRole.Admin) return { tenantId };
  if (role === UserRole.DepartmentOwner && departmentId) {
    return { tenantId, departmentId };
  }
  return { tenantId, owners: { some: { userId } } };
}

/** Prisma include shape that fetches the fields needed for ContractSummary. */
export const summaryInclude = {
  vendor: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  owners: { include: { user: { select: { id: true, name: true } } } },
} as const;

/** Maps a Prisma row (with nested includes) to the ContractSummary shape. */
export function toSummary(row: {
  id: string;
  tenantId: string;
  internalGroupEntity: string;
  endDate: Date;
  renewalNoticeDeadline: Date | null;
  status: string;
  vendor: { id: string; name: string };
  department: { id: string; name: string };
  owners: { user: { id: string; name: string } }[];
}): ContractSummary {
  return {
    id: row.id,
    tenantId: row.tenantId,
    internalGroupEntity: row.internalGroupEntity,
    endDate: row.endDate,
    renewalNoticeDeadline: row.renewalNoticeDeadline,
    status: row.status as ContractStatus,
    vendor: row.vendor,
    department: row.department,
    owners: row.owners.map((o) => o.user),
  };
}
