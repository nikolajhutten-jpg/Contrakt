import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createUser, getUserByEmail } from "@/lib/db/users";
import { created, badRequest, conflict, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

const VALID_ROLES = Object.values(UserRole) as string[];

async function sendClerkInvitation(email: string): Promise<void> {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    console.error("CLERK_SECRET_KEY is not set; skipping Clerk invitation");
    return;
  }

  const res = await fetch("https://api.clerk.com/v1/invitations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_address: email }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Clerk invitation failed (${res.status}): ${text}`);
  }
}

/**
 * POST /api/users/invite
 * Creates a local user record for the invited user, then fires a Clerk
 * invitation email. If the Clerk call fails the DB record still exists and
 * success is returned so the admin is not blocked.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null)
      return badRequest("Body must be JSON.");

    const b = body as Record<string, unknown>;

    if (typeof b.email !== "string" || !b.email.trim())
      return badRequest("email is required.");
    if (typeof b.name !== "string" || !b.name.trim())
      return badRequest("name is required.");
    if (typeof b.role !== "string" || !VALID_ROLES.includes(b.role))
      return badRequest(`role must be one of: ${VALID_ROLES.join(", ")}.`);

    const email = b.email.trim();
    const role = b.role as UserRole;

    const existing = await getUserByEmail(email);
    if (existing && existing.tenantId === tenantId)
      return conflict("A user with this email already exists.");

    const clerkId = `invite:${crypto.randomUUID()}`;

    const user = await createUser({
      tenantId,
      clerkId,
      name: b.name.trim(),
      email,
      role,
      departmentId:
        typeof b.departmentId === "string" ? b.departmentId : undefined,
    });

    // Best-effort: send Clerk invitation email. Errors are logged but do not
    // fail the request — the DB record already exists.
    await sendClerkInvitation(email);

    return created(user);
  } catch (error) {
    return handleError(error);
  }
}
