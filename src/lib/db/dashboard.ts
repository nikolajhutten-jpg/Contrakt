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
  renewals: number;
}

export interface DashboardKpis {
  total: number;
  active: number;
  actionRequired: number;
  renewalsDue: number;
}

export interface OnboardingState {
  departmentsAdded: boolean;
  firstUserInvited: boolean;
  slackConnected: boolean;
  firstContractUploaded: boolean;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Upcoming-renewals window: notice deadline within the next 90 days. */
function renewalWindow() {
  const now = new Date();
  const boundary = new Date(now);
  boundary.setDate(now.getDate() + 90);
  return { gte: now, lte: boundary };
}

// ─── Badge counts (used by Sidebar) ──────────────────────────────────────────

export async function countActionRequired(ctx: RoleContext): Promise<number> {
  return db.contract.count({
    where: { ...contractWhere(ctx), status: ContractStatus.ActionRequired },
  });
}

export async function countUpcomingRenewals(ctx: RoleContext): Promise<number> {
  return db.contract.count({
    where: {
      ...contractWhere(ctx),
      status: ContractStatus.Active,
      renewalNoticeDeadline: renewalWindow(),
    },
  });
}

export async function getBadgeCounts(ctx: RoleContext): Promise<BadgeCounts> {
  const [actionRequired, renewals] = await Promise.all([
    countActionRequired(ctx),
    countUpcomingRenewals(ctx),
  ]);
  return { actionRequired, renewals };
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export async function getDashboardKpis(
  ctx: RoleContext,
): Promise<DashboardKpis> {
  const base = contractWhere(ctx);
  const [total, active, actionRequired, renewalsDue] = await Promise.all([
    db.contract.count({ where: base }),
    db.contract.count({ where: { ...base, status: ContractStatus.Active } }),
    db.contract.count({
      where: { ...base, status: ContractStatus.ActionRequired },
    }),
    db.contract.count({
      where: {
        ...base,
        status: ContractStatus.Active,
        renewalNoticeDeadline: renewalWindow(),
      },
    }),
  ]);
  return { total, active, actionRequired, renewalsDue };
}

// ─── Dashboard contract lists ─────────────────────────────────────────────────

export async function getActionRequiredContracts(
  ctx: RoleContext,
): Promise<ContractSummary[]> {
  const rows = await db.contract.findMany({
    where: { ...contractWhere(ctx), status: ContractStatus.ActionRequired },
    orderBy: { renewalNoticeDeadline: "asc" },
    include: summaryInclude,
  });
  return rows.map(toSummary);
}

export async function getUpcomingRenewalsContracts(
  ctx: RoleContext,
): Promise<ContractSummary[]> {
  const rows = await db.contract.findMany({
    where: {
      ...contractWhere(ctx),
      status: ContractStatus.Active,
      renewalNoticeDeadline: renewalWindow(),
    },
    orderBy: { renewalNoticeDeadline: "asc" },
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
