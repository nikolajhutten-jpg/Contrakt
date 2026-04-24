import { resolveAuthContext } from "@/lib/auth/session";
import { getAllSentAlerts, getContractOptions } from "@/lib/db/notifications";
import AlertsListShell from "@/components/notifications/AlertsListShell";
import { UserRole } from "@/types";

export const metadata = { title: "Sent alerts — Contrakt" };

export default async function SentAlertsPage() {
  const { localUser, tenantId } = await resolveAuthContext();

  const ctx = {
    role: localUser.role,
    userId: localUser.id,
    departmentId: localUser.departmentId,
    tenantId,
  };

  const [alerts, contracts] = await Promise.all([
    getAllSentAlerts(ctx),
    getContractOptions(ctx),
  ]);

  const canEdit =
    localUser.role === UserRole.Admin ||
    localUser.role === UserRole.BusinessOwner;

  return (
    <AlertsListShell
      title="Sent alerts"
      subtitle="All alerts that have been delivered"
      backHref="/notifications"
      alerts={alerts}
      contracts={contracts}
      canEdit={canEdit}
    />
  );
}
