import { db } from "@/lib/db/client";
import type { Vendor, VendorWithContractCount } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Contract row shape returned inside VendorWithContracts. */
export interface VendorContractRow {
  id: string;
  tenantId: string;
  groupEntity: { id: string; name: string } | null;
  endDate: Date;
  renewalNoticeDeadline: Date | null;
  status: string;
  autoRenewal: boolean;
  department: { id: string; name: string };
  owners: { user: { id: string; name: string } }[];
}

export interface VendorWithContracts extends Vendor {
  contracts: VendorContractRow[];
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getVendorsByTenant(tenantId: string): Promise<Vendor[]> {
  return db.vendor.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

export async function getVendorsByOwner(
  userId: string,
  tenantId: string,
): Promise<VendorWithContractCount[]> {
  const rows = await db.vendor.findMany({
    where: { tenantId, contracts: { some: { owners: { some: { userId } } } } },
    orderBy: { name: "asc" },
    include: { _count: { select: { contracts: true } } },
  });
  return rows.map(({ _count, ...rest }) => ({ ...rest, contractCount: _count.contracts }));
}

export async function getVendorsByDepartmentOrOwner(
  userId: string,
  departmentId: string | null,
  tenantId: string,
): Promise<VendorWithContractCount[]> {
  const contractScope = departmentId
    ? { OR: [{ departmentId }, { owners: { some: { userId } } }] }
    : { owners: { some: { userId } } };
  const rows = await db.vendor.findMany({
    where: { tenantId, contracts: { some: contractScope } },
    orderBy: { name: "asc" },
    include: { _count: { select: { contracts: true } } },
  });
  return rows.map(({ _count, ...rest }) => ({ ...rest, contractCount: _count.contracts }));
}

export async function getVendorsWithContractCounts(
  tenantId: string,
): Promise<VendorWithContractCount[]> {
  const rows = await db.vendor.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { contracts: true } } },
  });
  return rows.map(({ _count, ...rest }) => ({
    ...rest,
    contractCount: _count.contracts,
  }));
}

export async function getVendorById(
  vendorId: string,
  tenantId: string,
): Promise<Vendor | null> {
  return db.vendor.findFirst({
    where: { id: vendorId, tenantId },
  });
}

export async function getVendorWithContracts(
  vendorId: string,
  tenantId: string,
): Promise<VendorWithContracts | null> {
  return db.vendor.findFirst({
    where: { id: vendorId, tenantId },
    include: {
      contracts: {
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          groupEntity: { select: { id: true, name: true } },
          endDate: true,
          renewalNoticeDeadline: true,
          status: true,
          autoRenewal: true,
          department: { select: { id: true, name: true } },
          owners: {
            select: { user: { select: { id: true, name: true } } },
          },
        },
        orderBy: { endDate: "asc" },
      },
    },
  }) as Promise<VendorWithContracts | null>;
}

// ─── Write ────────────────────────────────────────────────────────────────────

export interface CreateVendorData {
  tenantId: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
}

export async function createVendor(data: CreateVendorData): Promise<Vendor> {
  return db.vendor.create({
    data: {
      tenantId: data.tenantId,
      name: data.name,
      contactName: data.contactName ?? null,
      contactEmail: data.contactEmail ?? null,
    },
  });
}

export interface UpdateVendorData {
  name?: string;
  contactName?: string | null;
  contactEmail?: string | null;
}

export async function updateVendor(
  vendorId: string,
  tenantId: string,
  data: UpdateVendorData,
): Promise<Vendor> {
  return db.vendor.update({
    where: { id: vendorId, tenantId },
    data,
  });
}
