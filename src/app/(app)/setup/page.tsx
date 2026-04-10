import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { getDepartmentsByTenant } from "@/lib/db/departments";
import { getOnboardingState } from "@/lib/db/dashboard";
import SetupWizard from "@/components/setup/SetupWizard";
import { UserRole } from "@/types";

export const metadata = { title: "Workspace setup — Contrakt" };

/**
 * Setup wizard page (§13.4).
 * Admin-only. Shown once after sign-up until the workspace is configured.
 * Non-admins are redirected to the dashboard.
 * If setup is already complete (departments exist) redirect to dashboard.
 */
export default async function SetupPage() {
  const { localUser, tenantId } = await resolveAuthContext();

  if (localUser.role !== UserRole.Admin) {
    redirect("/dashboard");
  }

  const [departments, onboarding] = await Promise.all([
    getDepartmentsByTenant(tenantId),
    getOnboardingState(tenantId),
  ]);

  // If all setup steps are already done, skip wizard
  if (
    onboarding.departmentsAdded &&
    onboarding.firstUserInvited &&
    onboarding.slackConnected
  ) {
    redirect("/dashboard");
  }

  return <SetupWizard initialDepartments={departments} />;
}
