import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/session";
import { UserRole } from "@/types";

export default async function SettingsPage() {
  const { localUser } = await resolveAuthContext();
  redirect(localUser.role === UserRole.Admin ? "/settings/account" : "/settings/profile");
}
