import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getTenantSettings } from "@/lib/db/settings";
import { updateTenantBilling } from "@/lib/db/billing";
import {
  createCustomer,
  createCheckoutSession,
  STRIPE_PRICES,
} from "@/lib/services/stripe";
import { ok, badRequest, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";
import { db } from "@/lib/db/client";

const VALID_PLANS = ["starter", "team", "business"] as const;
type PlanKey = (typeof VALID_PLANS)[number];

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout Session for plan selection (§15.5).
 * Admin only. Returns a hosted checkout URL for the client to redirect to.
 *
 * Body: { plan: "starter" | "team" | "business" }
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { tenantId, localUser } = await requireRole([UserRole.Admin]);

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null)
      return badRequest("Body must be JSON.");

    const b = body as Record<string, unknown>;
    if (!VALID_PLANS.includes(b.plan as PlanKey))
      return badRequest(`plan must be one of: ${VALID_PLANS.join(", ")}.`);

    const plan = b.plan as PlanKey;
    const priceId = STRIPE_PRICES[plan];
    if (!priceId)
      return badRequest(`Price ID for plan "${plan}" is not configured in environment variables.`);

    const tenant = await getTenantSettings(tenantId);
    if (!tenant) return badRequest("Tenant not found.");

    // Seat count drives the Stripe subscription quantity (§15.5)
    const seatCount = await db.user.count({ where: { tenantId } });

    // Provision a Stripe customer on first checkout
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      customerId = await createCustomer(tenantId, tenant.name, localUser.email);
      await updateTenantBilling(tenantId, { stripeCustomerId: customerId });
    }

    const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const sessionUrl = await createCheckoutSession(
      customerId,
      priceId,
      seatCount,
      tenantId,
      `${baseUrl}/settings/account?billing=success`,
      `${baseUrl}/settings/account?billing=canceled`,
    );

    return ok({ url: sessionUrl });
  } catch (error) {
    return handleError(error);
  }
}
