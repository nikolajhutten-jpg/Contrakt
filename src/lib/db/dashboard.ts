import { db } from "@/lib/db/client";
import { ContractStatus } from "@/types";
import type { ContractSummary } from "@/types";
import type { RoleContext } from "@/lib/db/contractHelpers";
import {
  contractWhere,
  summaryInclude,
  toSummary,
} from "@/lib/db/contractHelpers";
export type { RoleContext } from "@/lib/db/contractHelpers";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface BadgeCounts {
  actionRequired: number;
}

export interface DashboardKpis {
  total: number;
  actionRequired: number;
}

export interface OnboardingState {
  departmentsAdded: boolean;
  firstUserInvited: boolean;
  slackConnected: boolean;
  firstContractUploaded: boolean;
}

// ─── Badge counts (used by Sidebar) ──────────────────────────────────────────

export async function getBadgeCounts(ctx: RoleContext): Promise<BadgeCounts> {
  const actionRequired = await db.contract.count({
    where: { ...contractWhere(ctx), status: ContractStatus.ActionRequired },
  });
  return { actionRequired };
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export async function getDashboardKpis(
  ctx: RoleContext,
): Promise<DashboardKpis> {
  const base = contractWhere(ctx);
  const now = new Date();
  const in60Days = new Date(now);
  in60Days.setDate(now.getDate() + 60);

  const [total, actionRequired] = await Promise.all([
    db.contract.count({ where: base }),
    db.contract.count({
      where: {
        ...base,
        OR: [
          { renewalNoticeDeadline: { gt: now, lte: in60Days } },
          { renewalNoticeDeadline: null, endDate: { gt: now, lte: in60Days } },
        ],
      },
    }),
  ]);
  return { total, actionRequired };
}

// ─── Dashboard contract lists ─────────────────────────────────────────────────

export async function getActionRequiredContracts(
  ctx: RoleContext,
): Promise<ContractSummary[]> {
  const now = new Date();
  const in60Days = new Date(now);
  in60Days.setDate(now.getDate() + 60);

  const rows = await db.contract.findMany({
    where: {
      ...contractWhere(ctx),
      OR: [
        { renewalNoticeDeadline: { gt: now, lte: in60Days } },
        { renewalNoticeDeadline: null, endDate: { gt: now, lte: in60Days } },
      ],
    },
    orderBy: [
      { renewalNoticeDeadline: { sort: "asc", nulls: "last" } },
      { endDate: "asc" },
    ],
    include: summaryInclude,
  });
  return rows.map(toSummary);
}

export async function getActiveContracts(
  ctx: RoleContext,
): Promise<ContractSummary[]> {
  const now = new Date();
  const in60Days = new Date(now);
  in60Days.setDate(now.getDate() + 60);

  // Excludes contracts already shown in the "Action required" section.
  const rows = await db.contract.findMany({
    where: {
      ...contractWhere(ctx),
      status: ContractStatus.Active,
      AND: [
        {
          NOT: {
            OR: [
              { renewalNoticeDeadline: { gte: now, lte: in60Days } },
              { renewalNoticeDeadline: null, endDate: { gte: now, lte: in60Days } },
            ],
          },
        },
      ],
    },
    orderBy: [
      { renewalNoticeDeadline: { sort: "asc", nulls: "last" } },
      { endDate: "asc" },
    ],
    take: 15,
    include: summaryInclude,
  });
  return rows.map(toSummary);
}

export async function getUpcomingRenewalsContracts(
  ctx: RoleContext,
): Promise<ContractSummary[]> {
  const now = new Date();
  const in60Days = new Date(now);
  in60Days.setDate(now.getDate() + 60);

  const rows = await db.contract.findMany({
    where: {
      ...contractWhere(ctx),
      status: ContractStatus.Active,
      OR: [
        { renewalNoticeDeadline: { gte: now, lte: in60Days } },
        { renewalNoticeDeadline: null, endDate: { gte: now, lte: in60Days } },
      ],
    },
    orderBy: [
      { renewalNoticeDeadline: { sort: "asc", nulls: "last" } },
      { endDate: "asc" },
    ],
    take: 15,
    include: summaryInclude,
  });
  return rows.map(toSummary);
}

// ─── Onboarding state (§13.7) ────────────────────────────────────────────────

export async function getOnboardingState(
  tenantId: string,
): Promise<OnboardingState> {
  const [departmentCount, userCount, tenant, contractCount] = await Promise.all(
    [
      db.department.count({ where: { tenantId } }),
      db.user.count({ where: { tenantId } }),
      db.tenant.findFirst({
        where: { id: tenantId },
        select: { slackWebhookUrl: true },
      }),
      db.contract.count({ where: { tenantId } }),
    ],
  );

  return {
    departmentsAdded: departmentCount > 0,
    firstUserInvited: userCount > 1,
    slackConnected: Boolean(tenant?.slackWebhookUrl),
    firstContractUploaded: contractCount > 0,
  };
}
