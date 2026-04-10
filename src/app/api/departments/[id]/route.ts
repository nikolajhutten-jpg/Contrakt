import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import {
  getDepartmentById,
  renameDepartment,
  deactivateDepartment,
} from "@/lib/db/departments";
import { ok, notFound, badRequest, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/departments/[id] — rename (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);
    const { id } = await params;

    const department = await getDepartmentById(id, tenantId);
    if (!department) return notFound("Department not found.");

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null)
      return badRequest("Body must be JSON.");

    const b = body as Record<string, unknown>;
    if (typeof b.name !== "string" || b.name.trim() === "")
      return badRequest("name is required.");

    const updated = await renameDepartment(id, tenantId, b.name.trim());
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/departments/[id] — soft-deactivate (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);
    const { id } = await params;

    const department = await getDepartmentById(id, tenantId);
    if (!department) return notFound("Department not found.");

    if (!department.isActive) return ok(department); // idempotent

    const updated = await deactivateDepartment(id, tenantId);
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
