import { resolveAuthContext } from "@/lib/auth/session";
import { getAllUpcomingAlerts, getContractOptions } from "@/lib/db/notifications";
import AlertsListShell from "@/components/notifications/AlertsListShell";
import { UserRole } from "@/types";

export const metadata = { title: "Upcoming alerts — Contrakt" };

export default async function UpcomingAlertsPage() {
  const { localUser, tenantId } = await resolveAuthContext();

  const ctx = {
    role: localUser.role,
    userId: localUser.id,
    departmentId: localUser.departmentId,
    tenantId,
  };

  const [alerts, contracts] = await Promise.all([
    getAllUpcomingAlerts(ctx),
    getContractOptions(ctx),
  ]);

  const canEdit =
    localUser.role === UserRole.Admin ||
    localUser.role === UserRole.BusinessOwner;

  return (
    <AlertsListShell
      title="Upcoming alerts"
      subtitle="All scheduled alerts that have not been sent"
      backHref="/notifications"
      alerts={alerts}
      contracts={contracts}
      canEdit={canEdit}
    />
  );
}
