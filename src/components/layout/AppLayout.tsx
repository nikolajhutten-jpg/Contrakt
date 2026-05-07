import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/users";
import { getTenantById } from "@/lib/db/tenants";
import { getBadgeCounts } from "@/lib/db/dashboard";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import OfflineBanner from "@/components/ui/OfflineBanner";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const { userId, orgId } = await auth();

  if (!userId) redirect("/sign-in");

  const localUser = await getUserByClerkId(userId);
  if (!localUser) redirect("/setup");

  const tenantId = orgId ?? localUser.tenantId;
  const tenant = await getTenantById(tenantId);
  if (!tenant) redirect("/sign-in");

  if (!tenant.setupComplete) redirect("/setup");

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
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
          <OfflineBanner />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </ToastProvider>
  );
}
