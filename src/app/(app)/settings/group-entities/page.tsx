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
    <div style={{ padding: "28px 32px", maxWidth: "640px" }}>
      <h1 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em", color: "#171717" }}>
        Group entities
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "3px", marginBottom: "28px" }}>
        Define the legal entities in your group
      </p>
      <GroupEntityList initialEntities={entities} />
    </div>
  );
}
