import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import {
  getDashboardKpis,
  getUpcomingRenewalsContracts,
  getOnboardingState,
} from "@/lib/db/dashboard";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { UserRole } from "@/types";

export const metadata = { title: "Home — Contrakt" };

export default async function DashboardPage() {
  const { localUser, tenantId } = await resolveAuthContext();

  const ctx = {
    role: localUser.role,
    userId: localUser.id,
    departmentId: localUser.departmentId,
    tenantId,
  };

  const [kpis, upcomingRenewals, onboarding] =
    await Promise.all([
      getDashboardKpis(ctx),
      getUpcomingRenewalsContracts(ctx),
      getOnboardingState(tenantId),
    ]);

  // Stage 3 redirect (§13.4): send new admins to the setup wizard
  if (localUser.role === UserRole.Admin && !onboarding.departmentsAdded) {
    redirect("/setup");
  }

  return (
    <DashboardShell
      kpis={kpis}
      upcomingRenewals={upcomingRenewals}
      onboarding={onboarding}
      isAdmin={localUser.role === "admin"}
    />
  );
}
