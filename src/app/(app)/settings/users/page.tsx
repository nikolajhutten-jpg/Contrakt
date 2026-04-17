import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { getUsersByTenant } from "@/lib/db/users";
import { getDepartmentsByTenant } from "@/lib/db/departments";
import { UserRole } from "@/types";
import UserTable from "@/components/settings/users/UserTable";
import InviteUserForm from "@/components/settings/users/InviteUserForm";

export const metadata = { title: "User management — Contrakt" };

export default async function UsersSettingsPage() {
  const { localUser, tenantId } = await resolveAuthContext();
  if (localUser.role !== UserRole.Admin) redirect("/dashboard");

  const [users, departments] = await Promise.all([
    getUsersByTenant(tenantId),
    getDepartmentsByTenant(tenantId),
  ]);

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1000px" }}>
      <h1 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em", color: "#171717" }}>
        Users
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "3px", marginBottom: "28px" }}>
        Invite and manage your team
      </p>

      <div style={{ marginBottom: "32px" }}>
        <InviteUserForm departments={departments} />
      </div>

      <UserTable
        initialUsers={users}
        departments={departments}
        currentUserId={localUser.id}
      />
    </div>
  );
}
