import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getUserById, updateUser, deactivateUser } from "@/lib/db/users";
import { ok, notFound, badRequest, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";
import type { UpdateUserInput } from "@/lib/db/users";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/users/[id] — update role or department (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);
    const { id } = await params;

    const target = await getUserById(id, tenantId);
    if (!target) return notFound("User not found.");

    const body: unknown = await request.json();
    const patch = parsePatch(body);
    if (typeof patch === "string") return badRequest(patch);

    const updated = await updateUser(id, tenantId, patch);
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/users/[id] — deactivate user (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { localUser, tenantId } = await requireRole([UserRole.Admin]);
    const { id } = await params;

    // Prevent admins from deactivating themselves
    if (id === localUser.id) {
      return badRequest("You cannot deactivate your own account.");
    }

    const target = await getUserById(id, tenantId);
    if (!target) return notFound("User not found.");

    await deactivateUser(id, tenantId);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}

const VALID_ROLES = Object.values(UserRole) as string[];

function parsePatch(body: unknown): UpdateUserInput | string {
  if (typeof body !== "object" || body === null) return "Body must be JSON.";
  const b = body as Record<string, unknown>;
  const patch: UpdateUserInput = {};

  if ("role" in b) {
    if (typeof b.role !== "string" || !VALID_ROLES.includes(b.role))
      return `role must be one of: ${VALID_ROLES.join(", ")}.`;
    patch.role = b.role as UserRole;
  }
  if ("departmentId" in b) {
    if (typeof b.departmentId !== "string" && b.departmentId !== null)
      return "departmentId must be a string or null.";
    patch.departmentId = b.departmentId as string | null;
  }

  return patch;
}
