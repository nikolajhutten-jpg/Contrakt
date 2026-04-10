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
      <h1 className="text-base font-medium text-gray-900 mb-1">
        Create your account
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Start your 14-day free trial — no credit card required.
      </p>
      <SignupForm />
    </>
  );
}
