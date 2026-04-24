/**
 * Shared helpers used by both contracts.ts and dashboard.ts.
 * Kept in a separate file so neither module exceeds 200 lines.
 */
import { UserRole, ContractStatus, TermType } from "@/types";
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
  groupEntity: { select: { id: true, name: true } },
  owners: { include: { user: { select: { id: true, name: true } } } },
} as const;

// Note: startDate is a scalar on the contract row itself — no include needed.

/** Maps a Prisma row (with nested includes) to the ContractSummary shape. */
export function toSummary(row: {
  id: string;
  tenantId: string;
  groupEntity: { id: string; name: string } | null;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  termType: string;
  renewalNoticeDeadline: Date | null;
  status: string;
  autoRenewal: boolean;
  vendor: { id: string; name: string };
  department: { id: string; name: string };
  owners: { user: { id: string; name: string } }[];
}): ContractSummary {
  return {
    id: row.id,
    tenantId: row.tenantId,
    groupEntity: row.groupEntity,
    startDate: row.startDate,
    endDate: row.endDate,
    durationMonths: row.durationMonths,
    termType: row.termType as TermType,
    renewalNoticeDeadline: row.renewalNoticeDeadline,
    status: row.status as ContractStatus,
    autoRenewal: row.autoRenewal,
    vendor: row.vendor,
    department: row.department,
    owners: row.owners.map((o) => o.user),
  };
}
