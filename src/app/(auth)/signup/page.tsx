import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth/config";
import SignupForm from "@/components/auth/SignupForm";

export const metadata = { title: "Create your account — Contrakt" };

/**
 * Sign-up page (§13.2).
 * If the user already has a valid session they are redirected to the dashboard.
 */
export default async function SignupPage() {
  const session = await auth0.getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <>
      <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#171717", letterSpacing: "-0.02em", marginBottom: "4px" }}>
        Create your account
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "24px" }}>
        Start your 14-day free trial — no credit card required.
      </p>
      <SignupForm />
    </>
  );
}
