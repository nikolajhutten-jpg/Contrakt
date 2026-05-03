import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createUser } from "@/lib/db/users";
import { created, badRequest, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

const VALID_ROLES = Object.values(UserRole) as string[];

/**
 * POST /api/users/invite
 * Creates a local user record for an invited user.
 * In production: call Clerk Backend API first to provision the user and
 * send the invite email; use the returned Clerk user ID here.
 * For now a placeholder clerkId is generated so the record can be created
 * immediately.
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

    // Placeholder until Clerk Backend API is wired up
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

    return created(user);
  } catch (error) {
    return handleError(error);
  }
}
