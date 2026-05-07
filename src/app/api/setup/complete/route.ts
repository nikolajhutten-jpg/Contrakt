import { requireRole } from "@/lib/auth/session";
import { updateTenantSettings } from "@/lib/db/settings";
import { ok, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

// PATCH /api/setup/complete — marks setup as done for the tenant (admin only)
export async function PATCH(): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);
    const updated = await updateTenantSettings(tenantId, { setupComplete: true });
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
