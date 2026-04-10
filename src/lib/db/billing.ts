import { db } from "@/lib/db/client";
import type { Tenant, TenantPlan, TenantPlanStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpdateTenantBillingData {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
  plan?: TenantPlan;
  planStatus?: TenantPlanStatus;
  trialEndsAt?: Date | null;
  seatCount?: number;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Updates billing fields on a tenant record.
 * Called by the webhook handler and the checkout flow.
 */
export async function updateTenantBilling(
  tenantId: string,
  data: UpdateTenantBillingData,
): Promise<Tenant> {
  return db.tenant.update({ where: { id: tenantId }, data });
}

/**
 * Looks up a tenant by their Stripe Customer ID.
 * Used in webhook handlers to resolve which tenant an event belongs to.
 */
export async function getTenantByStripeCustomerId(
  stripeCustomerId: string,
): Promise<Tenant | null> {
  return db.tenant.findFirst({ where: { stripeCustomerId } });
}

/**
 * Looks up a tenant by their Stripe Subscription ID.
 * Used in subscription.updated and subscription.deleted webhook handlers.
 */
export async function getTenantByStripeSubscriptionId(
  stripeSubscriptionId: string,
): Promise<Tenant | null> {
  return db.tenant.findFirst({ where: { stripeSubscriptionId } });
}
