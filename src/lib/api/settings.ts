/**
 * Client-side API helpers for account settings.
 */
import type { Tenant } from "@/types";

export async function updateAccountSettings(data: {
  name?: string;
  slackWebhookUrl?: string | null;
}): Promise<Tenant> {
  const res = await fetch("/api/settings/account", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update settings.");
  return res.json() as Promise<Tenant>;
}

export async function testSlackWebhook(): Promise<void> {
  const res = await fetch("/api/settings/account/test-slack", {
    method: "POST",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Slack test failed.");
  }
}
