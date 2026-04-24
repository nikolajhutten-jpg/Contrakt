import { ContractStatus } from "@/types";

/**
 * Derives the display status from contract date fields and auto-renewal flag.
 * Rules are applied in order; the DB-stored status field is not used.
 *
 * 1. Auto-renewed (blue)    — autoRenewal AND deadline exists AND deadline < today AND endDate >= today
 * 2. Expired (gray)         — endDate < today AND autoRenewal is false
 * 3. Action required (amber) — deadline (or endDate if no deadline) is within 0–60 days in future
 * 4. Active (green)         — everything else
 */
export function getDisplayStatus(contract: {
  autoRenewal: boolean;
  renewalNoticeDeadline: Date | null;
  endDate: Date;
}): ContractStatus | "renewal_due" {
  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const end = new Date(contract.endDate);
  const deadline = contract.renewalNoticeDeadline
    ? new Date(contract.renewalNoticeDeadline)
    : null;

  // Rule 1: notice deadline has passed, contract still running → auto-renewed window
  if (contract.autoRenewal && deadline !== null && deadline < now && end >= now) {
    return ContractStatus.AutoRenewed;
  }

  // Rule 2: non-auto-renewal contract past its end date → expired
  if (end < now && !contract.autoRenewal) {
    return ContractStatus.Expired;
  }

  // Rule 3: deadline (or end date if no deadline) approaching within 60 days
  if (deadline !== null && deadline > now && deadline <= in60Days) {
    return "renewal_due";
  }
  if (deadline === null && end > now && end <= in60Days) {
    return "renewal_due";
  }

  // Rule 4: everything else → active
  return ContractStatus.Active;
}
