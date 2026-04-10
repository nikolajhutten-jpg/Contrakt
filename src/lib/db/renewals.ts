/**
 * getRenewalsFiltered — role-aware query for contracts with upcoming renewal
 * notice deadlines. Supports department and date-range filters.
 */
import { db } from "@/lib/db/client";
import { ContractStatus } from "@/types";
import type { ContractSummary } from "@/types";
import {
  contractWhere,
  summaryInclude,
  toSummary,
} from "@/lib/db/contractHelpers";
import type { RoleContext } from "@/lib/db/contractHelpers";

export interface RenewalsFilterParams {
  departmentId?: string;
  /** ISO date strings bounding renewalNoticeDeadline */
  deadlineFrom?: string;
  deadlineTo?: string;
}

export async function getRenewalsFiltered(
  ctx: RoleContext,
  filters: RenewalsFilterParams = {},
): Promise<ContractSummary[]> {
  const base = contractWhere(ctx);

  // Default lower bound: today (show present and future deadlines)
  const deadlineGte = filters.deadlineFrom
    ? new Date(filters.deadlineFrom)
    : new Date();

  const where = {
    ...base,
    status: ContractStatus.Active,
    renewalNoticeDeadline: {
      gte: deadlineGte,
      ...(filters.deadlineTo && { lte: new Date(filters.deadlineTo) }),
    },
    ...(filters.departmentId && { departmentId: filters.departmentId }),
  };

  const rows = await db.contract.findMany({
    where,
    orderBy: { renewalNoticeDeadline: "asc" },
    include: summaryInclude,
  });

  return rows.map(toSummary);
}
