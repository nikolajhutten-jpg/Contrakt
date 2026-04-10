/**
 * Client-side API helpers for user operations.
 */
import type { User, UserRole } from "@/types";

interface InviteUserInput {
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string;
}

export async function inviteUser(input: InviteUserInput): Promise<User> {
  const res = await fetch("/api/users/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to invite user.");
  }
  return res.json() as Promise<User>;
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
  departmentId: string | null,
): Promise<User> {
  const res = await fetch(`/api/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, departmentId }),
  });
  if (!res.ok) throw new Error("Failed to update user.");
  return res.json() as Promise<User>;
}

export async function deactivateUser(userId: string): Promise<void> {
  const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to deactivate user.");
  }
}

export async function updateMyProfile(input: {
  name?: string;
  email?: string;
  slackUserId?: string | null;
}): Promise<User> {
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update profile.");
  return res.json() as Promise<User>;
}
