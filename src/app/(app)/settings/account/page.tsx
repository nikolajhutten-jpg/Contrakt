import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { getTenantSettings } from "@/lib/db/settings";
import { getPlanUsage } from "@/lib/services/planLimits";
import { UserRole } from "@/types";
import AccountSettingsForm from "@/components/settings/account/AccountSettingsForm";
import BillingSection from "@/components/settings/account/BillingSection";
import ViewOptions from "@/components/settings/account/ViewOptions";

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
    <div style={{ padding: "28px 32px", maxWidth: "860px" }}>
      <h1 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em", color: "#171717" }}>
        Account settings
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "3px", marginBottom: "28px" }}>
        Manage your company name and integrations
      </p>

      <AccountSettingsForm tenant={tenant} />

      <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", marginTop: "32px", paddingTop: "32px" }}>
        <ViewOptions />
      </div>

      <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", marginTop: "32px", paddingTop: "32px" }}>
        <BillingSection tenant={tenant} usage={usage} />
      </div>
    </div>
  );
}
