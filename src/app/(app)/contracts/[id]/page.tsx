import { notFound } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { getContractById } from "@/lib/db/contracts";
import { UserRole } from "@/types";
import ContractDetailShell from "@/components/contracts/detail/ContractDetailShell";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  return { title: "Contract Detail — Contrakt" };
}

export default async function ContractDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { localUser, tenantId } = await resolveAuthContext();

  const contract = await getContractById(id, tenantId);
  if (!contract) notFound();

  const canEdit =
    localUser.role === UserRole.Admin ||
    (localUser.role === UserRole.BusinessOwner &&
      contract!.owners.some((o) => o.userId === localUser.id));

  return (
    <ContractDetailShell
      contract={contract!}
      canEdit={canEdit}
      currentUserId={localUser.id}
    />
  );
}
