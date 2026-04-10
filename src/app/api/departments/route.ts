import { NextRequest } from "next/server";
import { resolveAuthContext, requireRole } from "@/lib/auth/session";
import { getDepartmentsByTenant, createDepartment } from "@/lib/db/departments";
import { ok, created, badRequest, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

// GET /api/departments — all authenticated users
export async function GET(): Promise<Response> {
  try {
    const { tenantId } = await resolveAuthContext();
    const departments = await getDepartmentsByTenant(tenantId);
    return ok(departments);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/departments — admin only
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null)
      return badRequest("Body must be JSON.");

    const b = body as Record<string, unknown>;
    if (typeof b.name !== "string" || b.name.trim() === "")
      return badRequest("name is required.");

    const department = await createDepartment(tenantId, b.name.trim());
    return created(department);
  } catch (error) {
    return handleError(error);
  }
}
