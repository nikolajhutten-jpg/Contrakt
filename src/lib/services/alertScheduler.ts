/**
 * Alert scheduler — queries all unsent notification alerts, evaluates trigger
 * dates, fires email and Slack notifications, and marks alerts as sent.
 * Implements §6 notification logic and §14.3 failure handling.
 */
import { db } from "@/lib/db/client";
import {
  sendEmailNotification,
  sendSlackNotification,
} from "@/lib/services/notifications";
import { AlertChannel, AlertTriggerReference, PeriodUnit } from "@/types";

// ─── Trigger date calculation ─────────────────────────────────────────────────

/**
 * Calculates the date on which this alert should fire.
 * Returns null if the reference date is missing (e.g. no renewalNoticeDeadline).
 */
function calcTriggerDate(
  triggerValue: number,
  triggerUnit: string,
  triggerReference: string,
  renewalNoticeDeadline: Date | null,
  endDate: Date,
): Date | null {
  const ref =
    triggerReference === AlertTriggerReference.RenewalNoticeDeadline
      ? renewalNoticeDeadline
      : endDate;
  if (!ref) return null;

  const d = new Date(ref);
  if (triggerUnit === PeriodUnit.Months) {
    d.setMonth(d.getMonth() - triggerValue);
  } else {
    d.setDate(d.getDate() - triggerValue);
  }
  return d;
}

// ─── Notification dispatch ────────────────────────────────────────────────────

type AlertRow = Awaited<ReturnType<typeof queryPendingAlerts>>[number];

async function queryPendingAlerts(tenantId?: string) {
  return db.notificationAlert.findMany({
    where: {
      sentAt: null,
      ...(tenantId ? { tenantId } : {}),
    },
    include: {
      contract: {
        include: {
          owners: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          vendor: { select: { name: true } },
          tenant: { select: { slackWebhookUrl: true } },
        },
      },
    },
  });
}

async function dispatch(alert: AlertRow, now: Date): Promise<void> {
  const { contract } = alert;
  const channels = alert.channels as AlertChannel[];
  const vendorName = contract.vendor.name;
  const deadline = contract.renewalNoticeDeadline
    ? new Date(contract.renewalNoticeDeadline).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "N/A";

  const subject = `Action required: ${vendorName} renewal`;
  const body =
    `The renewal notice deadline for ${vendorName} is ${deadline}. ` +
    `Please review the contract and confirm what action has been taken.`;

  let emailOk = false;
  let slackOk = false;

  // Email — send to every owner if email is a configured channel
  if (channels.includes(AlertChannel.Email)) {
    for (const { user } of contract.owners) {
      const sent = await sendEmailNotification(user.email, subject, body);
      if (sent) emailOk = true;
    }
  }

  // Slack — send to tenant webhook if Slack is a configured channel
  if (channels.includes(AlertChannel.Slack)) {
    const webhookUrl = contract.tenant.slackWebhookUrl;
    if (webhookUrl) {
      slackOk = await sendSlackNotification(webhookUrl, body);
      // §14.3: Slack failed — email serves as fallback if also configured
      if (!slackOk) {
        console.error(
          `[alertScheduler] Slack failed for alert ${alert.id}.` +
            (channels.includes(AlertChannel.Email)
              ? " Email was already sent as fallback."
              : " No email fallback configured."),
        );
      }
    } else {
      console.warn(
        `[alertScheduler] Alert ${alert.id} has Slack channel but tenant has no webhook URL.`,
      );
    }
  }

  // §14.3: log if all channels failed (contract status update still proceeds)
  if (!emailOk && !slackOk) {
    console.error(
      `[alertScheduler] All channels failed for alert ${alert.id} ` +
        `on contract ${contract.id} (${vendorName}).`,
    );
  }

  // Mark alert sent regardless of notification outcome
  await db.notificationAlert.update({
    where: { id: alert.id },
    data: { sentAt: now },
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Queries all unsent notification alerts, evaluates each trigger date against
 * today, dispatches due notifications via email and/or Slack, and marks them sent.
 *
 * Pass `tenantId` to scope the run to a single tenant; omit to run across all tenants.
 * §6: covers the "X months/days before renewal notice deadline" and "before end date" triggers.
 */
export async function checkAndFireAlerts(tenantId?: string): Promise<void> {
  const now = new Date();
  const alerts = await queryPendingAlerts(tenantId);

  for (const alert of alerts) {
    const { contract } = alert;
    const triggerDate = calcTriggerDate(
      alert.triggerValue,
      alert.triggerUnit,
      alert.triggerReference,
      contract.renewalNoticeDeadline,
      contract.endDate,
    );

    // Skip if trigger date not yet reached or reference date is missing
    if (!triggerDate || triggerDate > now) continue;

    await dispatch(alert, now);
  }
}
