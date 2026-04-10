/**
 * Contract status updater — runs daily to apply automatic status transitions per §6:
 *   Active → Action Required when renewal notice deadline is reached
 *   Active | Action Required → Expired when end date passes with no action confirmed
 *
 * When a contract moves to Action Required, email and Slack alerts are sent to
 * all business owners per §6 ("Renewal notice deadline reached" trigger).
 * §14.3: notification failures are logged but never block the status update.
 */
import { db } from "@/lib/db/client";
import { ContractStatus } from "@/types";
import {
  sendEmailNotification,
  sendSlackNotification,
} from "@/lib/services/notifications";

// ─── Notification helper ──────────────────────────────────────────────────────

type ContractWithOwners = Awaited<
  ReturnType<typeof db.contract.findMany<{
    include: {
      owners: { include: { user: { select: { email: true; name: true } } } };
      vendor: { select: { name: true } };
      tenant: { select: { slackWebhookUrl: true } };
    };
  }>>
>[number];

/** Notifies all business owners that a contract has reached Action Required status. */
async function notifyActionRequired(contract: ContractWithOwners): Promise<void> {
  const vendorName = contract.vendor.name;
  const deadline = contract.renewalNoticeDeadline
    ? new Date(contract.renewalNoticeDeadline).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "N/A";

  const subject = `Action required: ${vendorName} renewal deadline reached`;
  const body =
    `The renewal notice deadline for ${vendorName} was ${deadline}. ` +
    `The contract status has been updated to Action Required. ` +
    `Please log in to Contrakt and confirm what action has been taken.`;

  let emailOk = false;

  for (const { user } of contract.owners) {
    const sent = await sendEmailNotification(user.email, subject, body);
    if (sent) emailOk = true;
  }

  const webhookUrl = contract.tenant.slackWebhookUrl;
  if (webhookUrl) {
    const slackOk = await sendSlackNotification(webhookUrl, body);
    // §14.3: Slack failed — email served as fallback above
    if (!slackOk) {
      console.error(
        `[statusUpdater] Slack notification failed for contract ${contract.id}. ` +
          (emailOk ? "Email was sent as fallback." : "Email also failed."),
      );
    }
  }

  if (!emailOk) {
    // §14.3: both channels failed; status update still proceeds
    console.error(
      `[statusUpdater] All notifications failed for contract ${contract.id} (${vendorName}). ` +
        "Contract status was still updated to Action Required.",
    );
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Applies automatic contract status transitions for the current date.
 * Pass `tenantId` to scope the run to a single tenant; omit to run across all tenants.
 *
 * Transition 1 — Active → Action Required:
 *   Contracts where renewalNoticeDeadline has passed. Notifies owners.
 *
 * Transition 2 — Active | Action Required → Expired:
 *   Contracts where endDate has passed and no action was confirmed.
 */
export async function updateContractStatuses(tenantId?: string): Promise<void> {
  const now = new Date();
  const scope = tenantId ? { tenantId } : {};

  // ── Transition 1: Active → Action Required ──────────────────────────────
  const deadlineReached = await db.contract.findMany({
    where: {
      ...scope,
      status: ContractStatus.Active,
      renewalNoticeDeadline: { lte: now },
    },
    include: {
      owners: {
        include: { user: { select: { email: true, name: true } } },
      },
      vendor: { select: { name: true } },
      tenant: { select: { slackWebhookUrl: true } },
    },
  });

  for (const contract of deadlineReached) {
    await db.contract.update({
      where: { id: contract.id },
      data: { status: ContractStatus.ActionRequired },
    });
    // §6: send notification when deadline reached; §14.3: never throws
    await notifyActionRequired(contract);
  }

  // ── Transition 2: Active | Action Required → Expired ────────────────────
  // Uses updateMany — no per-row notification needed for expiry per §6
  await db.contract.updateMany({
    where: {
      ...scope,
      status: { in: [ContractStatus.Active, ContractStatus.ActionRequired] },
      endDate: { lte: now },
      actionConfirmed: false,
    },
    data: { status: ContractStatus.Expired },
  });
}
