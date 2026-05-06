import { resolveAuthContext } from "@/lib/auth/session";
import { getDepartmentsByTenant } from "@/lib/db/departments";
import { getContractsFiltered } from "@/lib/db/contractsFiltered";
import type { ContractFilterParams } from "@/lib/db/contractsFiltered";
import { ContractStatus, TermType } from "@/types";
import ContractsShell from "@/components/contracts/ContractsShell";

export const metadata = { title: "All Contracts — Contrakt" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export default async function ContractsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { localUser, tenantId } = await resolveAuthContext();

  const ctx = {
    role: localUser.role,
    userId: localUser.id,
    departmentId: localUser.departmentId,
    tenantId,
  };

  const rawStatus = str(params.status);
  const filters: ContractFilterParams = {
    ...(rawStatus && Object.values(ContractStatus).includes(rawStatus as ContractStatus)
      ? { status: rawStatus as ContractStatus }
      : {}),
    ...(str(params.departmentId) && { departmentId: str(params.departmentId) }),
    ...(str(params.termType) && Object.values(TermType).includes(str(params.termType) as TermType)
      ? { termType: str(params.termType) as TermType }
      : {}),
    ...(str(params.autoRenewal) !== undefined && {
      autoRenewal: str(params.autoRenewal) === "true",
    }),
    ...(str(params.endDateFrom) && { endDateFrom: str(params.endDateFrom) }),
    ...(str(params.endDateTo) && { endDateTo: str(params.endDateTo) }),
    ...(str(params.search) && { search: str(params.search) }),
  };

  const [contracts, departments] = await Promise.all([
    getContractsFiltered(ctx, filters),
    getDepartmentsByTenant(tenantId),
  ]);

  return (
    <ContractsShell
      contracts={contracts}
      departments={departments}
      activeFilters={filters}
      isAdmin={localUser.role === "admin"}
    />
  );
}
