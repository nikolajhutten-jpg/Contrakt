import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { getTenantSettings } from "@/lib/db/settings";
import { getPlanUsage } from "@/lib/services/planLimits";
import { UserRole } from "@/types";
import AccountSettingsForm from "@/components/settings/account/AccountSettingsForm";
import BillingSection from "@/components/settings/account/BillingSection";

export const metadata = { title: "Account settings — Contrakt" };

export default async function AccountSettingsPage() {
  const { localUser, tenantId } = await resolveAuthContext();
  if (localUser.role !== UserRole.Admin) redirect("/dashboard");

  const [tenant, usage] = await Promise.all([
    getTenantSettings(tenantId),
    getPlanUsage(tenantId),
  ]);

  if (!tenant) redirect("/dashboard");

  return (
    <div className="px-8 py-6 max-w-screen-xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Account settings</h1>

      <div className="space-y-10">
        <AccountSettingsForm tenant={tenant} />

        <div className="border-t border-gray-200 pt-8">
          <BillingSection tenant={tenant} usage={usage} />
        </div>
      </div>
    </div>
  );
}
