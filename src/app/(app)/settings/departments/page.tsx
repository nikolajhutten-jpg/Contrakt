import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { getDepartmentsByTenant } from "@/lib/db/departments";
import { UserRole } from "@/types";
import DepartmentList from "@/components/settings/departments/DepartmentList";

export const metadata = { title: "Departments — Contrakt" };

export default async function DepartmentsPage() {
  const { localUser, tenantId } = await resolveAuthContext();
  if (localUser.role !== UserRole.Admin) redirect("/dashboard");

  const departments = await getDepartmentsByTenant(tenantId);

  return (
    <div className="px-8 py-6 max-w-screen-xl">
      <h1 className="text-xl font-medium text-gray-900 mb-6">Departments</h1>
      <DepartmentList initialDepartments={departments} />
    </div>
  );
}
