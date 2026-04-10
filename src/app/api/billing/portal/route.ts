import { requireRole } from "@/lib/auth/session";
import { getTenantSettings } from "@/lib/db/settings";
import { createPortalSession } from "@/lib/services/stripe";
import { ok, badRequest, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session (§15.5).
 * Admin only. Returns a portal URL for the client to redirect to.
 * The portal allows managing the subscription, payment method, and invoices.
 */
export async function POST(): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);

    const tenant = await getTenantSettings(tenantId);
    if (!tenant) return badRequest("Tenant not found.");

    if (!tenant.stripeCustomerId) {
      return badRequest(
        "No Stripe customer on this account. Subscribe to a plan first.",
      );
    }

    const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const url = await createPortalSession(
      tenant.stripeCustomerId,
      `${baseUrl}/settings/account`,
    );

    return ok({ url });
  } catch (error) {
    return handleError(error);
  }
}
