import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createUser, getUserByEmail } from "@/lib/db/users";
import { ok, created, badRequest, conflict, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

const VALID_ROLES = Object.values(UserRole) as string[];

/**
 * Revokes all pending Clerk invitations for the given email address so a
 * fresh invitation can be sent without Clerk deduplication errors.
 */
async function cancelExistingClerkInvitations(
  email: string,
  secret: string,
): Promise<void> {
  const url = new URL("https://api.clerk.com/v1/invitations");
  url.searchParams.set("email_address", email);
  url.searchParams.set("status", "pending");

  const listRes = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!listRes.ok) {
    console.error(
      `Clerk invitation list failed (${listRes.status}): ${await listRes.text()}`,
    );
    return;
  }

  const invitations = (await listRes.json()) as { id: string }[];
  if (!Array.isArray(invitations) || invitations.length === 0) return;

  await Promise.all(
    invitations.map(async (inv) => {
      const revokeRes = await fetch(
        `https://api.clerk.com/v1/invitations/${inv.id}/revoke`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${secret}` },
        },
      );
      if (!revokeRes.ok) {
        console.error(
          `Failed to revoke invitation ${inv.id}: ${await revokeRes.text()}`,
        );
      }
    }),
  );
}

async function sendClerkInvitation(email: string, secret: string): Promise<void> {
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
 *
 * Fresh invite: creates a DB record with a placeholder clerkId, then sends a
 * Clerk invitation email. Returns 201 with the new user.
 *
 * Resend (pending user found by email): skips createUser(), cancels any
 * existing Clerk invitations for that address, sends a fresh one, and returns
 * 200 with the existing user record.
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
    const secret = process.env.CLERK_SECRET_KEY;

    const existing = await getUserByEmail(email);

    // ── Resend path ────────────────────────────────────────────────────────────
    // The user was already invited (placeholder clerkId). Reuse the existing DB
    // record: cancel any live Clerk invitation so a fresh one can be created.
    if (existing && existing.tenantId === tenantId && existing.clerkId.startsWith("invite:")) {
      if (secret) {
        await cancelExistingClerkInvitations(email, secret);
        await sendClerkInvitation(email, secret);
      } else {
        console.error("CLERK_SECRET_KEY is not set; skipping Clerk invitation");
      }
      return ok(existing);
    }

    // ── Duplicate guard ────────────────────────────────────────────────────────
    // Block invites for emails that belong to an active (non-pending) user.
    if (existing && existing.tenantId === tenantId)
      return conflict("A user with this email already exists.");

    // ── Fresh invite path ──────────────────────────────────────────────────────
    const role = b.role as UserRole;
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
    if (secret) {
      await sendClerkInvitation(email, secret);
    } else {
      console.error("CLERK_SECRET_KEY is not set; skipping Clerk invitation");
    }

    return created(user);
  } catch (error) {
    return handleError(error);
  }
}
