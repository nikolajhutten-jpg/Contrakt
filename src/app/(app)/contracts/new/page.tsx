import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { UserRole } from "@/types";
import UploadShell from "@/components/upload/UploadShell";

export const metadata = { title: "Upload contract — Contrakt" };

export default async function NewContractPage() {
  const { localUser } = await resolveAuthContext();
  if (localUser.role !== UserRole.Admin) redirect("/dashboard");
  return <UploadShell />;
}
