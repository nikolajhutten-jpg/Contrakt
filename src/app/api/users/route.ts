import { requireRole } from "@/lib/auth/session";
import { getUsersByTenant } from "@/lib/db/users";
import { ok, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

// GET /api/users — admin only
// To invite a user, use POST /api/users/invite instead.
export async function GET(): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);
    const users = await getUsersByTenant(tenantId);
    return ok(users);
  } catch (error) {
    return handleError(error);
  }
}
