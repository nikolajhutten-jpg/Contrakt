import { notFound } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { getVendorWithContracts } from "@/lib/db/vendors";
import { UserRole } from "@/types";
import VendorDetail from "@/components/vendors/VendorDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  return { title: "Vendor Detail — Contrakt" };
}

export default async function VendorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { localUser, tenantId } = await resolveAuthContext();

  const vendor = await getVendorWithContracts(id, tenantId);
  if (!vendor) notFound();

  return (
    <VendorDetail
      vendor={vendor}
      isAdmin={localUser.role === UserRole.Admin}
    />
  );
}
