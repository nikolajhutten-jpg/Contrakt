import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getTenantSettings, updateTenantSettings } from "@/lib/db/settings";
import { ok, notFound, badRequest, handleError } from "@/lib/api/response";
import { UserRole, TenantPlan } from "@/types";

// GET /api/settings/account — admin only
export async function GET(): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);
    const settings = await getTenantSettings(tenantId);
    if (!settings) return notFound("Tenant not found.");
    return ok(settings);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/settings/account — admin only
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null)
      return badRequest("Body must be JSON.");

    const b = body as Record<string, unknown>;
    const patch: Parameters<typeof updateTenantSettings>[1] = {};

    if ("slackWebhookUrl" in b) {
      if (typeof b.slackWebhookUrl !== "string" && b.slackWebhookUrl !== null)
        return badRequest("slackWebhookUrl must be a string or null.");
      patch.slackWebhookUrl = b.slackWebhookUrl as string | null;
    }
    if ("name" in b) {
      if (typeof b.name !== "string" || b.name.trim() === "")
        return badRequest("name must be a non-empty string.");
      patch.name = b.name.trim();
    }
    if ("plan" in b) {
      const raw = typeof b.plan === "string" ? b.plan.toLowerCase() : "";
      if (raw !== TenantPlan.Free)
        return badRequest("Only the Free plan can be set via this endpoint. Use Stripe checkout for paid plans.");
      patch.plan = TenantPlan.Free;
    }

    if (Object.keys(patch).length === 0) return badRequest("No valid fields provided.");

    const updated = await updateTenantSettings(tenantId, patch);
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
