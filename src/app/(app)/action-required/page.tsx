import { resolveAuthContext } from "@/lib/auth/session";
import { getActionRequiredContracts } from "@/lib/db/dashboard";
import ActionRequiredShell from "@/components/action-required/ActionRequiredShell";
import { UserRole } from "@/types";

export const metadata = { title: "Action Required — Contrakt" };

export default async function ActionRequiredPage() {
  const { localUser, tenantId } = await resolveAuthContext();

  const ctx = {
    role: localUser.role,
    userId: localUser.id,
    departmentId: localUser.departmentId,
    tenantId,
  };

  const contracts = await getActionRequiredContracts(ctx);

  const isAdmin = localUser.role === UserRole.Admin;
  const canConfirm = isAdmin || localUser.role === UserRole.BusinessOwner;

  return (
    <ActionRequiredShell
      contracts={contracts}
      currentUserId={localUser.id}
      isAdmin={isAdmin}
      canConfirm={canConfirm}
    />
  );
}
