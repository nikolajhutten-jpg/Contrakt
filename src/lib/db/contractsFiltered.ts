/**
 * getContractsFiltered — role-aware, multi-filter contract list query.
 * Split from contracts.ts to keep both files under the 200-line limit.
 */
import { db } from "@/lib/db/client";
import type { ContractSummary, ContractStatus, TermType } from "@/types";
import {
  contractWhere,
  summaryInclude,
  toSummary,
} from "@/lib/db/contractHelpers";
import type { RoleContext } from "@/lib/db/contractHelpers";

export interface ContractFilterParams {
  status?: ContractStatus;
  departmentId?: string;
  termType?: TermType;
  autoRenewal?: boolean;
  /** ISO date strings bounding endDate */
  endDateFrom?: string;
  endDateTo?: string;
  /** Free-text search across vendor name, department name, and owner name */
  search?: string;
}

export async function getContractsFiltered(
  ctx: RoleContext,
  filters: ContractFilterParams,
): Promise<ContractSummary[]> {
  const base = contractWhere(ctx);

  const where = {
    ...base,
    ...(filters.status && { status: filters.status }),
    ...(filters.departmentId && { departmentId: filters.departmentId }),
    ...(filters.termType && { termType: filters.termType }),
    ...(filters.autoRenewal !== undefined && {
      autoRenewal: filters.autoRenewal,
    }),
    ...(filters.endDateFrom || filters.endDateTo
      ? {
          endDate: {
            ...(filters.endDateFrom && { gte: new Date(filters.endDateFrom) }),
            ...(filters.endDateTo && { lte: new Date(filters.endDateTo) }),
          },
        }
      : {}),
    ...(filters.search && {
      OR: [
        {
          vendor: {
            name: { contains: filters.search, mode: "insensitive" as const },
          },
        },
        {
          department: {
            name: { contains: filters.search, mode: "insensitive" as const },
          },
        },
        {
          owners: {
            some: {
              user: {
                name: { contains: filters.search, mode: "insensitive" as const },
              },
            },
          },
        },
      ],
    }),
  };

  const rows = await db.contract.findMany({
    where,
    orderBy: { endDate: "asc" },
    include: summaryInclude,
  });
  return rows.map(toSummary);
}
