import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/services/stripe";
import {
  updateTenantBilling,
  getTenantByStripeSubscriptionId,
} from "@/lib/db/billing";
import { getPlanUsage } from "@/lib/services/planLimits";
import { TenantPlan, TenantPlanStatus } from "@/types";

const PLAN_USER_LIMITS: Record<string, number> = {
  free: 1,
  starter: 1,
  team: 5,
  business: 20,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps a Stripe Price ID to the matching internal plan name, or null if unrecognised. */
function priceIdToPlan(priceId: string): TenantPlan | null {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID)  return TenantPlan.Starter;
  if (priceId === process.env.STRIPE_TEAM_PRICE_ID)     return TenantPlan.Team;
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return TenantPlan.Business;
  console.error(
    `[billing/webhook] Unrecognised Stripe price ID "${priceId}". ` +
    "Check STRIPE_STARTER_PRICE_ID, STRIPE_TEAM_PRICE_ID, and STRIPE_BUSINESS_PRICE_ID env vars.",
  );
  return null;
}

/** Maps a Stripe subscription status to the internal plan status. */
function toInternalStatus(status: Stripe.Subscription.Status): TenantPlanStatus {
  switch (status) {
    case "active":
    case "trialing":
      return TenantPlanStatus.Active;
    case "past_due":
    case "unpaid":
      return TenantPlanStatus.PastDue;
    case "canceled":
      return TenantPlanStatus.Canceled;
    default:
      return TenantPlanStatus.Active;
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * POST /api/billing/webhook
 * Receives Stripe webhook events and updates the tenant's billing state.
 *
 * Events handled:
 *   checkout.session.completed     — tenant completed checkout; activate plan
 *   customer.subscription.updated  — plan, status, or seat count changed
 *   customer.subscription.deleted  — subscription cancelled; set to read-only (§15.4)
 *
 * The raw request body must be passed to constructEvent for signature verification.
 * Do NOT parse the body with request.json() before calling this handler.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe-Signature header." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        if (!tenantId || typeof session.subscription !== "string") break;

        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = sub.items.data[0]?.price.id ?? "";
        const plan = priceIdToPlan(priceId);
        if (!plan) {
          return NextResponse.json({ error: "Unrecognised price ID." }, { status: 400 });
        }

        await updateTenantBilling(tenantId, {
          plan,
          planStatus: TenantPlanStatus.Active,
          stripeSubscriptionId: session.subscription,
          seatCount: sub.items.data[0]?.quantity ?? 1,
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const tenant = await getTenantByStripeSubscriptionId(sub.id);
        if (!tenant) break;

        const priceId = sub.items.data[0]?.price.id ?? "";
        const newPlan = priceIdToPlan(priceId);
        if (!newPlan) {
          return NextResponse.json({ error: "Unrecognised price ID." }, { status: 400 });
        }
        const newStatus = toInternalStatus(sub.status);

        await updateTenantBilling(tenant.id, {
          plan: newPlan,
          planStatus: newStatus,
          seatCount: sub.items.data[0]?.quantity ?? tenant.seatCount,
        });

        // Seat overage guard: if the new plan allows fewer users than are
        // currently active (e.g. downgrade via Stripe portal), lock the tenant
        // to read_only so the admin must deactivate excess users before
        // regaining full access.
        const newLimit = PLAN_USER_LIMITS[newPlan];
        if (newLimit !== undefined) {
          const usage = await getPlanUsage(tenant.id);
          if (usage.users > newLimit) {
            console.warn(
              `[billing/webhook] Tenant ${tenant.id} has ${usage.users} users but downgraded to ${newPlan} (limit ${newLimit}). Locking to read_only.`,
            );
            await updateTenantBilling(tenant.id, { planStatus: TenantPlanStatus.ReadOnly });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        // §15.4: subscription cancelled — move to read-only
        const sub = event.data.object as Stripe.Subscription;
        const tenant = await getTenantByStripeSubscriptionId(sub.id);
        if (!tenant) break;

        await updateTenantBilling(tenant.id, {
          plan: TenantPlan.Free,
          planStatus: TenantPlanStatus.ReadOnly,
          stripeSubscriptionId: null,
        });
        break;
      }

      default:
        // Unhandled events are acknowledged without action
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
