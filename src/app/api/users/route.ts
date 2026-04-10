import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getUsersByTenant, createUser } from "@/lib/db/users";
import { ok, created, badRequest, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

// GET /api/users — admin only
export async function GET(): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);
    const users = await getUsersByTenant(tenantId);
    return ok(users);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/users — invite user by email (admin only)
// Creates the local user record. Auth0 invite email is sent via a separate
// Auth0 Management API call (to be wired up in the service layer).
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);

    const body: unknown = await request.json();
    const input = parseInput(body);
    if (typeof input === "string") return badRequest(input);

    const user = await createUser({
      tenantId,
      auth0Id: input.auth0Id,
      name: input.name,
      email: input.email,
      role: input.role,
      departmentId: input.departmentId,
    });

    return created(user);
  } catch (error) {
    return handleError(error);
  }
}

type ParsedInput = {
  auth0Id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
};

const VALID_ROLES = Object.values(UserRole) as string[];

function parseInput(body: unknown): ParsedInput | string {
  if (typeof body !== "object" || body === null) return "Body must be JSON.";
  const b = body as Record<string, unknown>;

  if (typeof b.auth0Id !== "string" || b.auth0Id.trim() === "")
    return "auth0Id is required.";
  if (typeof b.name !== "string" || b.name.trim() === "")
    return "name is required.";
  if (typeof b.email !== "string" || b.email.trim() === "")
    return "email is required.";
  if (typeof b.role !== "string" || !VALID_ROLES.includes(b.role))
    return `role must be one of: ${VALID_ROLES.join(", ")}.`;

  return {
    auth0Id: b.auth0Id.trim(),
    name: b.name.trim(),
    email: b.email.trim(),
    role: b.role as UserRole,
    departmentId: typeof b.departmentId === "string" ? b.departmentId : undefined,
  };
}
