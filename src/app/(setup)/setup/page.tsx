import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserByClerkId, getUserByEmail } from "@/lib/db/users";
import { getDepartmentsByTenant } from "@/lib/db/departments";
import { getOnboardingState } from "@/lib/db/dashboard";
import { getTenantSettings } from "@/lib/db/settings";
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

    const [departments, onboarding, tenant] = await Promise.all([
      getDepartmentsByTenant(localUser.tenantId),
      getOnboardingState(localUser.tenantId),
      getTenantSettings(localUser.tenantId),
    ]);

    if (
      tenant?.name &&
      onboarding.departmentsAdded &&
      onboarding.firstUserInvited
      // Slack UI hidden — backend intact
    ) {
      redirect("/dashboard");
    }

    return <SetupWizard initialDepartments={departments} />;
  }

  // No DB user by clerkId — but check if this email belongs to a deactivated
  // account. If so, prevent them from provisioning a new workspace.
  const clerkUser = await currentUser();
  const primaryEmail =
    clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;

  if (primaryEmail) {
    const existingByEmail = await getUserByEmail(primaryEmail);
    if (existingByEmail && !existingByEmail.clerkId.startsWith("invite:")) {
      // Email exists with a real clerkId — this is a deactivated user
      // who re-signed up. Do not allow a new workspace to be created.
      redirect("/sign-in");
    }
  }

  // Fresh Clerk signup — show wizard with empty state
  return <SetupWizard initialDepartments={[]} />;
}
