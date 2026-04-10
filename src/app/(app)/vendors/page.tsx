import { resolveAuthContext } from "@/lib/auth/session";
import { getVendorsWithContractCounts } from "@/lib/db/vendors";
import { UserRole } from "@/types";
import VendorList from "@/components/vendors/VendorList";

export const metadata = { title: "Vendors — Contrakt" };

export default async function VendorsPage() {
  const { localUser, tenantId } = await resolveAuthContext();

  const vendors = await getVendorsWithContractCounts(tenantId);

  return (
    <VendorList
      vendors={vendors}
      isAdmin={localUser.role === UserRole.Admin}
    />
  );
}
