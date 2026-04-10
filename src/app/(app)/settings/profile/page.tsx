import { resolveAuthContext } from "@/lib/auth/session";
import ProfileForm from "@/components/settings/profile/ProfileForm";

export const metadata = { title: "Profile — Contrakt" };

export default async function ProfilePage() {
  const { localUser } = await resolveAuthContext();

  return (
    <div className="px-8 py-6 max-w-screen-xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile & notifications</h1>
      <ProfileForm user={localUser} />
    </div>
  );
}
