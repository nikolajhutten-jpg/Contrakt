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
    <div className="px-8 py-6 max-w-screen-xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">User management</h1>

      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Invite a user</h2>
        <InviteUserForm departments={departments} />
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Team members ({users.length})
        </h2>
        <UserTable
          initialUsers={users}
          departments={departments}
          currentUserId={localUser.id}
        />
      </div>
    </div>
  );
}
