import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/services/stripe";
import {
  updateTenantBilling,
  getTenantByStripeSubscriptionId,
} from "@/lib/db/billing";
import { TenantPlan, TenantPlanStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps a Stripe Price ID to the matching internal plan name. */
function priceIdToPlan(priceId: string): TenantPlan {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return TenantPlan.Starter;
  if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) return TenantPlan.Growth;
  // Unknown price — default to Starter; admin should verify Stripe configuration
  return TenantPlan.Starter;
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

        await updateTenantBilling(tenantId, {
          plan: priceIdToPlan(priceId),
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
        await updateTenantBilling(tenant.id, {
          plan: priceIdToPlan(priceId),
          planStatus: toInternalStatus(sub.status),
          seatCount: sub.items.data[0]?.quantity ?? tenant.seatCount,
        });
        break;
      }

      case "customer.subscription.deleted": {
        // §15.4: subscription cancelled — move to read-only
        const sub = event.data.object as Stripe.Subscription;
        const tenant = await getTenantByStripeSubscriptionId(sub.id);
        if (!tenant) break;

        await updateTenantBilling(tenant.id, {
          plan: TenantPlan.Trial,
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
