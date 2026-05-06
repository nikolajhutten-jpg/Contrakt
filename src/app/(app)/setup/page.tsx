import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/users";
import { getDepartmentsByTenant } from "@/lib/db/departments";
import { getOnboardingState } from "@/lib/db/dashboard";
import SetupWizard from "@/components/setup/SetupWizard";
import { UserRole } from "@/types";

export const metadata = { title: "Workspace setup — Contrakt" };

/**
 * Setup wizard page (§13.4).
 * Requires only a valid Clerk session — no DB user needed yet.
 * If a DB user exists and is not admin, redirect to dashboard.
 * If setup is already complete, redirect to dashboard.
 */
export default async function SetupPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const localUser = await getUserByClerkId(userId);

  // If DB user exists, apply role and completion checks
  if (localUser) {
    if (localUser.role !== UserRole.Admin) {
      redirect("/dashboard");
    }

    const [departments, onboarding] = await Promise.all([
      getDepartmentsByTenant(localUser.tenantId),
      getOnboardingState(localUser.tenantId),
    ]);

    if (
      onboarding.departmentsAdded &&
      onboarding.firstUserInvited
      // Slack UI hidden — backend intact
    ) {
      redirect("/dashboard");
    }

    return <SetupWizard initialDepartments={departments} />;
  }

  // No DB user yet — fresh Clerk signup, show wizard with empty state
  return <SetupWizard initialDepartments={[]} />;
}
