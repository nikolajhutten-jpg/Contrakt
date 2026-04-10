import { ContractStatus } from "@/types";

export function getDisplayStatus(contract: {
  status: ContractStatus;
  renewalNoticeDeadline: Date | null;
  endDate: Date;
}): ContractStatus | "renewal_due" {
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const relevantDate = contract.renewalNoticeDeadline ?? contract.endDate;

  if (contract.status === ContractStatus.Active && relevantDate <= sixtyDaysFromNow) {
    return "renewal_due";
  }

  return contract.status;
}
