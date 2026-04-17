import { redirect } from "next/navigation";
import { auth0, AUTH0_CLAIM_NS } from "@/lib/auth/config";
import { DEV_AUTH0_ID, DEV_TENANT_ID } from "@/lib/auth/session";
import { getUserByAuth0Id } from "@/lib/db/users";
import { getBadgeCounts } from "@/lib/db/dashboard";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import OfflineBanner from "@/components/ui/OfflineBanner";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface AppLayoutProps {
  children: React.ReactNode;
}

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Server Component — wraps every authenticated page.
 * Fetches the session, resolves the local user, and pre-loads badge counts
 * so the Sidebar has live numbers on every server render.
 *
 * In development, the Auth0 session check is skipped and the mock identity
 * (DEV_AUTH0_ID / DEV_TENANT_ID) is used directly. Run `npm run seed:dev`
 * once to insert the matching tenant and user rows into the database.
 */
export default async function AppLayout({ children }: AppLayoutProps) {
  let auth0Id: string;
  let tenantId: string;

  if (IS_DEV) {
    auth0Id  = DEV_AUTH0_ID;
    tenantId = DEV_TENANT_ID;
  } else {
    const session = await auth0.getSession();
    if (!session) redirect("/api/auth/login");

    const tenantIdClaim = session.user[`${AUTH0_CLAIM_NS}/tenant_id`];
    if (typeof tenantIdClaim !== "string" || tenantIdClaim === "") {
      redirect("/api/auth/login");
    }

    auth0Id  = session.user.sub;
    tenantId = tenantIdClaim;
  }

  const localUser = await getUserByAuth0Id(auth0Id, tenantId);

  if (!localUser) {
    // In dev this means the seed script hasn't been run yet.
    // In production it means the user exists in Auth0 but not the DB.
    if (IS_DEV) {
      throw new Error(
        "Dev user not found in database. Run `npm run seed:dev` to create it.",
      );
    }
    redirect("/api/auth/login");
  }

  const badgeCounts = await getBadgeCounts({
    role:         localUser.role,
    userId:       localUser.id,
    departmentId: localUser.departmentId,
    tenantId,
  });

  return (
    <ToastProvider>
      <div className="flex h-screen" style={{ background: "#f5f5f7" }}>
        <Sidebar
          user={{ name: localUser.name, role: localUser.role }}
          badgeCounts={badgeCounts}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <OfflineBanner />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </ToastProvider>
  );
}
