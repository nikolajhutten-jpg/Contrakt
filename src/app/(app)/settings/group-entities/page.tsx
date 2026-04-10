import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { getGroupEntitiesByTenant } from "@/lib/db/groupEntities";
import { UserRole } from "@/types";
import GroupEntityList from "@/components/settings/group-entities/GroupEntityList";

export const metadata = { title: "Group Entities — Contrakt" };

export default async function GroupEntitiesPage() {
  const { localUser, tenantId } = await resolveAuthContext();
  if (localUser.role !== UserRole.Admin) redirect("/settings/profile");

  const entities = await getGroupEntitiesByTenant(tenantId);

  return (
    <div className="px-8 py-6 max-w-screen-xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Group entities</h1>
      <GroupEntityList initialEntities={entities} />
    </div>
  );
}
