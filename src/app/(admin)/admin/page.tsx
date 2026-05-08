import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getAllTenants } from "@/lib/db/tenants";
import { env } from "@/env";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: "Admin — Contrakt" };

export default async function AdminPage() {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;

  if (!email || email !== env.SUPERADMIN_EMAIL) redirect("/dashboard");

  const tenants = await getAllTenants();

  return <AdminShell initialTenants={tenants} />;
}
