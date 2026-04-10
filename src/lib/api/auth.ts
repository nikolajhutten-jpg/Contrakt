/**
 * Client-side API helper for authentication flows.
 */

export interface SignupInput {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

/**
 * Submits the sign-up form to the provisioning API.
 * On success the backend has created the tenant and admin user records.
 * The user still needs to verify their email (via Auth0 in production)
 * before they can log in and access the setup wizard.
 */
export async function signup(input: SignupInput): Promise<void> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Sign-up failed. Please try again.");
  }
}
