import { db } from "@/lib/db/client";
import type {
  NotificationAlert,
  AlertChannel,
  PeriodUnit,
  AlertTriggerReference,
} from "@/types";

// Prisma stores channels as Json; this cast keeps the rest of the codebase
// typed against AlertChannel[] as declared in NotificationAlert.
function toAlert(row: {
  id: string;
  tenantId: string;
  contractId: string;
  triggerValue: number;
  triggerUnit: PeriodUnit;
  triggerReference: AlertTriggerReference;
  channels: unknown;
  sentAt: Date | null;
  createdAt: Date;
}): NotificationAlert {
  return {
    ...row,
    channels: row.channels as AlertChannel[],
  };
}

export async function getAlertsByContract(
  contractId: string,
  tenantId: string,
): Promise<NotificationAlert[]> {
  const rows = await db.notificationAlert.findMany({
    where: { contractId, tenantId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toAlert);
}

export async function getAlertById(
  alertId: string,
  contractId: string,
  tenantId: string,
): Promise<NotificationAlert | null> {
  const row = await db.notificationAlert.findFirst({
    where: { id: alertId, contractId, tenantId },
  });
  return row ? toAlert(row) : null;
}

export interface CreateAlertData {
  tenantId: string;
  contractId: string;
  triggerValue: number;
  triggerUnit: PeriodUnit;
  triggerReference: AlertTriggerReference;
  channels: AlertChannel[];
}

export async function createAlert(
  data: CreateAlertData,
): Promise<NotificationAlert> {
  const row = await db.notificationAlert.create({
    data: {
      tenantId: data.tenantId,
      contractId: data.contractId,
      triggerValue: data.triggerValue,
      triggerUnit: data.triggerUnit,
      triggerReference: data.triggerReference,
      channels: data.channels, // stored as Json
    },
  });
  return toAlert(row);
}

export interface UpdateAlertData {
  triggerValue?: number;
  triggerUnit?: PeriodUnit;
  triggerReference?: AlertTriggerReference;
  channels?: AlertChannel[];
}

export async function updateAlert(
  alertId: string,
  contractId: string,
  tenantId: string,
  data: UpdateAlertData,
): Promise<NotificationAlert> {
  const row = await db.notificationAlert.update({
    where: { id: alertId, contractId, tenantId },
    data: {
      ...data,
      // Re-cast channels to satisfy Prisma's Json expectation
      ...(data.channels !== undefined ? { channels: data.channels } : {}),
    },
  });
  return toAlert(row);
}

export async function deleteAlert(
  alertId: string,
  contractId: string,
  tenantId: string,
): Promise<void> {
  await db.notificationAlert.delete({
    where: { id: alertId, contractId, tenantId },
  });
}
