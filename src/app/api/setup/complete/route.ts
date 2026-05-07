import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { updateTenantSettings } from "@/lib/db/settings";
import { ok, handleError } from "@/lib/api/response";
import { UserRole, TenantPlan, TenantPlanStatus } from "@/types";

// GET /api/setup/complete?redirect=/dashboard
// Called by the Stripe success_url — marks setup complete and redirects the browser.
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { tenantId, tenant } = await requireRole([UserRole.Admin], { skipSetupCheck: true });
    // For free-plan tenants (plan not yet upgraded via Stripe), explicitly confirm
    // plan = free and planStatus = active in the same write so the state is unambiguous.
    const isFreeDefault = tenant.plan === TenantPlan.Free;
    await updateTenantSettings(tenantId, {
      setupComplete: true,
      ...(isFreeDefault ? { plan: TenantPlan.Free, planStatus: TenantPlanStatus.Active } : {}),
    });
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
    const { tenantId, tenant } = await requireRole([UserRole.Admin], { skipSetupCheck: true });
    const isFreeDefault = tenant.plan === TenantPlan.Free;
    const updated = await updateTenantSettings(tenantId, {
      setupComplete: true,
      ...(isFreeDefault ? { plan: TenantPlan.Free, planStatus: TenantPlanStatus.Active } : {}),
    });
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
