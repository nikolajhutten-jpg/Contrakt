import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { updateTenantSettings } from "@/lib/db/settings";
import { ok, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

// GET /api/setup/complete?redirect=/dashboard
// Called by the Stripe success_url — marks setup complete and redirects the browser.
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);
    await updateTenantSettings(tenantId, { setupComplete: true });
    const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/dashboard";
    const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
    return Response.redirect(new URL(safeRedirect, request.url));
  } catch (error) {
    return handleError(error);
  }
}

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
