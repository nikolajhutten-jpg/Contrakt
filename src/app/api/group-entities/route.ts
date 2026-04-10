import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { getGroupEntitiesByTenant, createGroupEntity } from "@/lib/db/groupEntities";
import { ok, created, badRequest, forbidden, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

export async function GET(): Promise<Response> {
  try {
    const { tenantId } = await resolveAuthContext();
    const entities = await getGroupEntitiesByTenant(tenantId);
    return ok(entities);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { localUser, tenantId } = await resolveAuthContext();
    if (localUser.role !== UserRole.Admin) return forbidden();

    const body = await request.json() as { name?: unknown };
    if (typeof body.name !== "string" || !body.name.trim()) {
      return badRequest("name is required.");
    }

    const entity = await createGroupEntity(tenantId, body.name.trim());
    return created(entity);
  } catch (error) {
    return handleError(error);
  }
}
