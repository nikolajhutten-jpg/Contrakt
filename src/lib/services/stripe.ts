import "@/env"; // validates all required environment variables at startup
import Stripe from "stripe";

/**
 * Singleton Stripe client.
 * STRIPE_SECRET_KEY must be set in .env.local (see .env.local for instructions).
 * Uses the Stripe API version shipped with the installed SDK.
 */
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * Maps paid plan names to Stripe Price IDs configured in .env.local.
 * Set STRIPE_STARTER_PRICE_ID, STRIPE_TEAM_PRICE_ID, and STRIPE_BUSINESS_PRICE_ID
 * in your Stripe dashboard.
 */
export const STRIPE_PRICES = {
  starter:  process.env.STRIPE_STARTER_PRICE_ID ?? "",
  team:     process.env.STRIPE_TEAM_PRICE_ID ?? "",
  business: process.env.STRIPE_BUSINESS_PRICE_ID ?? "",
} as const;

// ─── Customer ─────────────────────────────────────────────────────────────────

/**
 * Creates a Stripe Customer for a new tenant (§15.5).
 * Call once per tenant and persist the returned ID to tenants.stripe_customer_id.
 */
export async function createCustomer(
  tenantId: string,
  name: string,
  email: string,
): Promise<string> {
  const customer = await stripe.customers.create({
    name,
    email,
    metadata: { tenantId },
  });
  return customer.id;
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

/**
 * Creates a Stripe Checkout Session for plan selection.
 * Returns the hosted checkout URL to redirect the user to.
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  quantity: number,
  tenantId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { tenantId },
    subscription_data: { metadata: { tenantId } },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

// ─── Customer Portal ──────────────────────────────────────────────────────────

/**
 * Creates a Stripe Customer Portal session (§15.5).
 * Allows the customer to manage their subscription, payment method, and invoices.
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

// ─── Subscription helpers ─────────────────────────────────────────────────────

/** Retrieves a subscription by ID. */
export async function getSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

/** Cancels a subscription at the end of the current billing period. */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Syncs the active seat count to Stripe (§15.5).
 * Call on user invite and deactivation.
 */
export async function syncSeatCount(
  subscriptionId: string,
  quantity: number,
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = subscription.items.data[0]?.id;
  if (!itemId) throw new Error("Subscription has no line items to update.");
  await stripe.subscriptionItems.update(itemId, { quantity });
}
