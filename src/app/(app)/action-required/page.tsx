import { resolveAuthContext } from "@/lib/auth/session";
import { getActionRequiredContracts } from "@/lib/db/dashboard";
import ActionRequiredShell from "@/components/action-required/ActionRequiredShell";

export const metadata = { title: "Upcoming Renewals — Contrakt" };

export default async function ActionRequiredPage() {
  const { localUser, tenantId } = await resolveAuthContext();

  const ctx = {
    role: localUser.role,
    userId: localUser.id,
    departmentId: localUser.departmentId,
    tenantId,
  };

  const contracts = await getActionRequiredContracts(ctx);

  return <ActionRequiredShell contracts={contracts} />;
}
