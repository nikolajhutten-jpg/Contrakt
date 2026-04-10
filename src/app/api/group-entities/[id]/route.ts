import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { deactivateGroupEntity } from "@/lib/db/groupEntities";
import { ok, forbidden, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { localUser, tenantId } = await resolveAuthContext();
    if (localUser.role !== UserRole.Admin) return forbidden();

    const { id } = await params;
    const entity = await deactivateGroupEntity(id, tenantId);
    return ok(entity);
  } catch (error) {
    return handleError(error);
  }
}
