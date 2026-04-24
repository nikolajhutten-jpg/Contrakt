import { resolveAuthContext } from "@/lib/auth/session";
import ProfileForm from "@/components/settings/profile/ProfileForm";
import BackLink from "@/components/ui/BackLink";

export const metadata = { title: "Profile — Contrakt" };

export default async function ProfilePage() {
  const { localUser } = await resolveAuthContext();

  return (
    <div style={{ padding: "28px 32px", maxWidth: "640px" }}>
      <BackLink href="/settings/account" />
      <h1 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em", color: "#171717" }}>
        Profile
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "3px", marginBottom: "28px" }}>
        Update your personal details and notification preferences
      </p>
      <ProfileForm user={localUser} />
    </div>
  );
}
