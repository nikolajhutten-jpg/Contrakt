import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserByClerkId, getUserByEmailActive } from "@/lib/db/users";
import { getDepartmentsByTenant } from "@/lib/db/departments";
import { getTenantSettings } from "@/lib/db/settings";
import SetupWizard from "@/components/setup/SetupWizard";
import { UserRole } from "@/types";

export const metadata = { title: "Workspace setup — Contrakt" };

type Step = 0 | 1 | 2;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Setup wizard page.
 * Requires only a valid Clerk session — no DB user needed yet.
 * Redirects to /dashboard only when tenant.setupComplete is true.
 * Accepts ?step=N (1-indexed, 1–3) to resume at a specific step (e.g. after Stripe cancel).
 */
export default async function SetupPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const rawStep = typeof params.step === "string" ? parseInt(params.step, 10) : NaN;
  // URL uses 1-indexed steps; convert to 0-indexed for the wizard (max step index = 2)
  const initialStep: Step =
    !isNaN(rawStep) && rawStep >= 1 && rawStep <= 3
      ? (Math.min(2, rawStep - 1) as Step)
      : 0;

  const localUser = await getUserByClerkId(userId);

  if (localUser) {
    if (localUser.role !== UserRole.Admin) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#f5f5f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "384px",
              background: "#ffffff",
              border: "0.5px solid rgba(0,0,0,0.08)",
              borderRadius: "12px",
              padding: "32px",
            }}
          >
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#171717", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              Contrakt
            </p>
            <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.5)", lineHeight: 1.5 }}>
              Your workspace is being set up by your administrator. You&apos;ll get access once setup is complete.
            </p>
          </div>
        </div>
      );
    }

    const [departments, tenant] = await Promise.all([
      getDepartmentsByTenant(localUser.tenantId),
      getTenantSettings(localUser.tenantId),
    ]);

    if (tenant?.setupComplete) {
      redirect("/dashboard");
    }

    return (
      <SetupWizard
        initialDepartments={departments}
        initialStep={initialStep}
      />
    );
  }

  // No DB user by clerkId — check if this email belongs to a deactivated account.
  const clerkUser = await currentUser();
  const primaryEmail =
    clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;

  if (primaryEmail) {
    const existingByEmail = await getUserByEmailActive(primaryEmail);
    if (existingByEmail && !existingByEmail.clerkId.startsWith("invite:")) {
      redirect("/sign-in");
    }
  }

  // Fresh Clerk signup — show wizard with empty state
  return <SetupWizard initialDepartments={[]} initialStep={initialStep} />;
}
