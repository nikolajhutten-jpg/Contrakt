import { resolveAuthContext } from "@/lib/auth/session";
import { getDepartmentsByTenant } from "@/lib/db/departments";
import { getRenewalsFiltered } from "@/lib/db/renewals";
import type { RenewalsFilterParams } from "@/lib/db/renewals";
import RenewalsShell from "@/components/renewals/RenewalsShell";

export const metadata = { title: "Renewals — Contrakt" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export default async function RenewalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { localUser, tenantId } = await resolveAuthContext();

  const ctx = {
    role: localUser.role,
    userId: localUser.id,
    departmentId: localUser.departmentId,
    tenantId,
  };

  const filters: RenewalsFilterParams = {
    ...(str(params.departmentId) && { departmentId: str(params.departmentId) }),
    ...(str(params.deadlineFrom) && { deadlineFrom: str(params.deadlineFrom) }),
    ...(str(params.deadlineTo) && { deadlineTo: str(params.deadlineTo) }),
  };

  const [contracts, departments] = await Promise.all([
    getRenewalsFiltered(ctx, filters),
    getDepartmentsByTenant(tenantId),
  ]);

  return (
    <RenewalsShell
      contracts={contracts}
      departments={departments}
      activeFilters={filters}
    />
  );
}
