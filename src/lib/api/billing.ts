/**
 * Client-side API helpers for billing operations.
 */

/**
 * Starts a Stripe Checkout session for the given plan and redirects
 * the browser to the hosted Stripe checkout page.
 */
export async function startCheckout(plan: "starter" | "growth"): Promise<void> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to start checkout.");
  }
  const data = (await res.json()) as { data: { url: string } };
  window.location.href = data.data.url;
}

/**
 * Opens the Stripe Customer Portal and redirects the browser there.
 * Allows managing subscriptions, payment methods, and invoices.
 */
export async function openBillingPortal(): Promise<void> {
  const res = await fetch("/api/billing/portal", { method: "POST" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to open billing portal.");
  }
  const data = (await res.json()) as { data: { url: string } };
  window.location.href = data.data.url;
}
