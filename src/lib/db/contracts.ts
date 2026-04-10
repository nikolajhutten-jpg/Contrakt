import { db } from "@/lib/db/client";
import type {
  Contract,
  ContractWithRelations,
  ContractStatus,
  TermType,
  PeriodUnit,
} from "@/types";

// ─── Relation include shape reused across queries ─────────────────────────────

const contractWithRelations = {
  vendor: true,
  department: true,
  owners: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  documents: true,
  notificationAlerts: true,
} as const;

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getContractById(
  contractId: string,
  tenantId: string,
): Promise<ContractWithRelations | null> {
  return db.contract.findFirst({
    where: { id: contractId, tenantId },
    include: contractWithRelations,
  }) as Promise<ContractWithRelations | null>;
}

export async function getContractsByTenant(
  tenantId: string,
): Promise<Contract[]> {
  return db.contract.findMany({
    where: { tenantId },
    orderBy: { endDate: "asc" },
  });
}

export async function getContractsByOwner(
  userId: string,
  tenantId: string,
): Promise<Contract[]> {
  return db.contract.findMany({
    where: {
      tenantId,
      owners: { some: { userId } },
    },
    orderBy: { endDate: "asc" },
  });
}

export async function getContractsByDepartment(
  departmentId: string,
  tenantId: string,
): Promise<Contract[]> {
  return db.contract.findMany({
    where: { departmentId, tenantId },
    orderBy: { endDate: "asc" },
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────

export interface CreateContractData {
  tenantId: string;
  vendorId: string;
  departmentId: string;
  internalGroupEntity: string;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  termType: TermType;
  autoRenewal: boolean;
  renewalPeriodMonths: number | null;
  renewalNoticePeriodValue: number | null;
  renewalNoticePeriodUnit: PeriodUnit | null;
  renewalNoticeDeadline: Date | null;
  status: ContractStatus;
  ownerIds: string[];
}

export async function createContract(
  data: CreateContractData,
): Promise<ContractWithRelations> {
  const { ownerIds, ...fields } = data;
  return db.contract.create({
    data: {
      ...fields,
      owners: {
        create: ownerIds.map((userId) => ({ userId })),
      },
    },
    include: contractWithRelations,
  }) as Promise<ContractWithRelations>;
}

export interface UpdateContractData {
  vendorId?: string;
  departmentId?: string;
  internalGroupEntity?: string;
  startDate?: Date;
  endDate?: Date;
  durationMonths?: number;
  termType?: TermType;
  autoRenewal?: boolean;
  renewalPeriodMonths?: number | null;
  renewalNoticePeriodValue?: number | null;
  renewalNoticePeriodUnit?: PeriodUnit | null;
  renewalNoticeDeadline?: Date | null;
  status?: ContractStatus;
  actionConfirmed?: boolean;
  actionConfirmedAt?: Date | null;
  ownerIds?: string[];
}

export async function updateContract(
  contractId: string,
  tenantId: string,
  data: UpdateContractData,
): Promise<ContractWithRelations> {
  const { ownerIds, ...fields } = data;

  if (ownerIds !== undefined) {
    // Replace the full owner set atomically
    await db.contractOwner.deleteMany({ where: { contractId } });
    await db.contractOwner.createMany({
      data: ownerIds.map((userId) => ({ contractId, userId })),
    });
  }

  return db.contract.update({
    where: { id: contractId, tenantId },
    data: fields,
    include: contractWithRelations,
  }) as Promise<ContractWithRelations>;
}

export async function deleteContract(
  contractId: string,
  tenantId: string,
): Promise<void> {
  await db.contract.delete({
    where: { id: contractId, tenantId },
  });
}

