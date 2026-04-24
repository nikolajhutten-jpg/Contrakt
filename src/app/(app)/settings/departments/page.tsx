import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { getDepartmentsByTenant } from "@/lib/db/departments";
import { UserRole } from "@/types";
import DepartmentList from "@/components/settings/departments/DepartmentList";
import BackLink from "@/components/ui/BackLink";

export const metadata = { title: "Departments — Contrakt" };

export default async function DepartmentsPage() {
  const { localUser, tenantId } = await resolveAuthContext();
  if (localUser.role !== UserRole.Admin) redirect("/dashboard");

  const departments = await getDepartmentsByTenant(tenantId);

  return (
    <div style={{ padding: "28px 32px", maxWidth: "640px" }}>
      <BackLink href="/settings/account" />
      <h1 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em", color: "#171717" }}>
        Departments
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "3px", marginBottom: "28px" }}>
        Organise contracts by department
      </p>
      <DepartmentList initialDepartments={departments} />
    </div>
  );
}
