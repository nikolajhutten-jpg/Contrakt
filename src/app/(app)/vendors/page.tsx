import { resolveAuthContext } from "@/lib/auth/session";
import {
  getVendorsWithContractCounts,
  getVendorsByOwner,
  getVendorsByDepartmentOrOwner,
} from "@/lib/db/vendors";
import { UserRole } from "@/types";
import VendorList from "@/components/vendors/VendorList";

export const metadata = { title: "Vendors — Contrakt" };

export default async function VendorsPage() {
  const { localUser, tenantId } = await resolveAuthContext();

  let vendors: Awaited<ReturnType<typeof getVendorsWithContractCounts>>;
  if (localUser.role === UserRole.Admin) {
    vendors = await getVendorsWithContractCounts(tenantId);
  } else if (localUser.role === UserRole.DepartmentOwner) {
    vendors = await getVendorsByDepartmentOrOwner(
      localUser.id,
      localUser.departmentId,
      tenantId,
    );
  } else {
    vendors = await getVendorsByOwner(localUser.id, tenantId);
  }

  return (
    <VendorList
      vendors={vendors}
      isAdmin={localUser.role === UserRole.Admin}
    />
  );
}
