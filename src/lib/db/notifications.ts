import { db } from "@/lib/db/client";
import { UserRole, PeriodUnit, AlertChannel, AlertTriggerReference } from "@/types";
import { contractWhere } from "@/lib/db/contractHelpers";
import type { RoleContext } from "@/lib/db/contractHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertWithContract {
  id: string;
  contractId: string;
  tenantId: string;
  triggerValue: number;
  triggerUnit: PeriodUnit;
  triggerReference: AlertTriggerReference;
  channels: AlertChannel[];
  sentAt: Date | null;
  createdAt: Date;
  /** Computed: the date the alert is scheduled to fire. */
  alertDate: Date | null;
  contract: {
    id: string;
    endDate: Date;
    renewalNoticeDeadline: Date | null;
    vendor: { id: string; name: string };
  };
}

export interface ContractOption {
  id: string;
  vendorName: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Role-aware contract filter for use inside notificationAlert queries. */
function contractRelationFilter(ctx: RoleContext) {
  const { role, userId, departmentId } = ctx;
  if (role === UserRole.Admin) return {};
  if (role === UserRole.DepartmentOwner && departmentId) return { departmentId };
  return { owners: { some: { userId } } };
}

const ALERT_INCLUDE = {
  contract: {
    select: {
      id: true,
      endDate: true,
      renewalNoticeDeadline: true,
      vendor: { select: { id: true, name: true } },
    },
  },
} as const;

type RawRow = {
  id: string;
  contractId: string;
  tenantId: string;
  triggerValue: number;
  triggerUnit: string;
  triggerReference: string;
  channels: unknown;
  sentAt: Date | null;
  createdAt: Date;
  contract: {
    id: string;
    endDate: Date;
    renewalNoticeDeadline: Date | null;
    vendor: { id: string; name: string };
  };
};

function computeAlertDate(row: RawRow): Date | null {
  const ref =
    row.triggerReference === AlertTriggerReference.RenewalNoticeDeadline
      ? row.contract.renewalNoticeDeadline
      : row.contract.endDate;
  if (!ref) return null;
  const d = new Date(ref);
  if (row.triggerUnit === PeriodUnit.Months) {
    d.setMonth(d.getMonth() - row.triggerValue);
  } else {
    d.setDate(d.getDate() - row.triggerValue);
  }
  return d;
}

function toAlertWithContract(row: RawRow): AlertWithContract {
  return {
    ...row,
    triggerUnit: row.triggerUnit as PeriodUnit,
    triggerReference: row.triggerReference as AlertTriggerReference,
    channels: row.channels as AlertChannel[],
    alertDate: computeAlertDate(row),
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Unsent alerts whose computed fire date falls within the next `days` days. */
export async function getUpcomingAlerts(
  ctx: RoleContext,
  days = 30,
): Promise<AlertWithContract[]> {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + days);

  const rows = (await db.notificationAlert.findMany({
    where: { tenantId: ctx.tenantId, sentAt: null, contract: contractRelationFilter(ctx) },
    include: ALERT_INCLUDE,
    orderBy: { createdAt: "asc" },
  })) as RawRow[];

  return rows
    .map(toAlertWithContract)
    .filter((a) => a.alertDate !== null && a.alertDate >= now && a.alertDate <= cutoff)
    .sort((a, b) => (a.alertDate?.getTime() ?? 0) - (b.alertDate?.getTime() ?? 0));
}

/** Sent alerts whose sentAt falls within the last `days` days. */
export async function getSentAlerts(
  ctx: RoleContext,
  days = 30,
): Promise<AlertWithContract[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const rows = (await db.notificationAlert.findMany({
    where: {
      tenantId: ctx.tenantId,
      sentAt: { gte: cutoff },
      contract: contractRelationFilter(ctx),
    },
    include: ALERT_INCLUDE,
    orderBy: { sentAt: "desc" },
  })) as RawRow[];

  return rows.map(toAlertWithContract);
}

/** All unsent alerts, no date limit. */
export async function getAllUpcomingAlerts(
  ctx: RoleContext,
): Promise<AlertWithContract[]> {
  const rows = (await db.notificationAlert.findMany({
    where: { tenantId: ctx.tenantId, sentAt: null, contract: contractRelationFilter(ctx) },
    include: ALERT_INCLUDE,
    orderBy: { createdAt: "asc" },
  })) as RawRow[];

  return rows
    .map(toAlertWithContract)
    .sort((a, b) => (a.alertDate?.getTime() ?? 0) - (b.alertDate?.getTime() ?? 0));
}

/** All sent alerts, no date limit. */
export async function getAllSentAlerts(
  ctx: RoleContext,
): Promise<AlertWithContract[]> {
  const rows = (await db.notificationAlert.findMany({
    where: {
      tenantId: ctx.tenantId,
      sentAt: { gte: new Date(0) },
      contract: contractRelationFilter(ctx),
    },
    include: ALERT_INCLUDE,
    orderBy: { sentAt: "desc" },
  })) as RawRow[];

  return rows.map(toAlertWithContract);
}

/** Minimal contract list for the "Add alert" contract selector dropdown. */
export async function getContractOptions(
  ctx: RoleContext,
): Promise<ContractOption[]> {
  const rows = await db.contract.findMany({
    where: contractWhere(ctx),
    select: { id: true, vendor: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({ id: r.id, vendorName: r.vendor.name }));
}
