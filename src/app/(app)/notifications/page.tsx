import { resolveAuthContext } from "@/lib/auth/session";
import {
  getAllUpcomingAlerts,
  getAllSentAlerts,
  getContractOptions,
} from "@/lib/db/notifications";
import NotificationsShell from "@/components/notifications/NotificationsShell";
import { UserRole } from "@/types";

export const metadata = { title: "Notifications — Contrakt" };

export default async function NotificationsPage() {
  const { localUser, tenantId } = await resolveAuthContext();

  const ctx = {
    role: localUser.role,
    userId: localUser.id,
    departmentId: localUser.departmentId,
    tenantId,
  };

  const [allUpcoming, allSent, contracts] = await Promise.all([
    getAllUpcomingAlerts(ctx),
    getAllSentAlerts(ctx),
    getContractOptions(ctx),
  ]);

  const upcomingAlerts = allUpcoming.slice(0, 10);
  const sentAlerts = allSent.slice(0, 10);

  const canEdit =
    localUser.role === UserRole.Admin ||
    localUser.role === UserRole.BusinessOwner;

  return (
    <NotificationsShell
      upcomingAlerts={upcomingAlerts}
      sentAlerts={sentAlerts}
      contracts={contracts}
      canEdit={canEdit}
    />
  );
}
