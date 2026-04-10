import { ContractStatus, PeriodUnit } from "@/types";
import type { CreateContractInput } from "@/types";
import type { CreateContractData } from "@/lib/db/contracts";

/**
 * Rounds total days to the nearest month (using 30.44 days/month average),
 * with a minimum of 1. This gives correct results for short ranges like
 * "01 Apr → 30 Apr" (1 month) and "01 Jan → 31 Dec" (12 months).
 */
export function calculateDurationMonths(
  startDate: Date,
  endDate: Date,
): number {
  const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(days / 30.44));
}

/**
 * Subtracts a notice period from the contract end date to get the deadline
 * by which the business owner must act. Returns null if no notice period is set.
 */
export function calculateNoticeDeadline(
  endDate: Date,
  value: number | null,
  unit: PeriodUnit | null,
): Date | null {
  if (value === null || unit === null) return null;

  const deadline = new Date(endDate);
  if (unit === PeriodUnit.Months) {
    deadline.setMonth(deadline.getMonth() - value);
  } else {
    deadline.setDate(deadline.getDate() - value);
  }
  return deadline;
}

/**
 * Determines the initial contract status based on dates at upload time.
 * Applies §14.5 edge cases:
 *   - End date in the past → Expired immediately
 *   - Notice deadline already passed → Action Required immediately
 *   - Otherwise → Active
 */
export function determineInitialStatus(
  endDate: Date,
  noticeDeadline: Date | null,
): ContractStatus {
  const now = new Date();
  if (endDate <= now) return ContractStatus.Expired;
  if (noticeDeadline !== null && noticeDeadline <= now) {
    return ContractStatus.ActionRequired;
  }
  return ContractStatus.Active;
}

/**
 * Assembles the full CreateContractData record from user-submitted input.
 * Calculates derived fields (duration, deadline, status) so route handlers
 * stay free of business logic.
 */
export function buildCreateContractData(
  input: CreateContractInput,
  tenantId: string,
): CreateContractData {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const durationMonths = calculateDurationMonths(startDate, endDate);
  const renewalNoticeDeadline = calculateNoticeDeadline(
    endDate,
    input.renewalNoticePeriodValue,
    input.renewalNoticePeriodUnit,
  );
  const status = determineInitialStatus(endDate, renewalNoticeDeadline);

  return {
    tenantId,
    vendorId: input.vendorId,
    departmentId: input.departmentId,
    groupEntityId: input.groupEntityId,
    startDate,
    endDate,
    durationMonths,
    termType: input.termType,
    autoRenewal: input.autoRenewal,
    renewalPeriodMonths: input.renewalPeriodMonths,
    renewalNoticePeriodValue: input.renewalNoticePeriodValue,
    renewalNoticePeriodUnit: input.renewalNoticePeriodUnit,
    renewalNoticeDeadline,
    status,
    ownerIds: input.ownerIds,
  };
}
