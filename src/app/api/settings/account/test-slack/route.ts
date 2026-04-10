import { requireRole } from "@/lib/auth/session";
import { getTenantSettings } from "@/lib/db/settings";
import { ok, badRequest, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

/**
 * POST /api/settings/account/test-slack
 * Sends a test message to the tenant's configured Slack webhook URL.
 * Admin only. Returns 400 if no webhook URL is configured.
 */
export async function POST(): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);

    const settings = await getTenantSettings(tenantId);
    if (!settings?.slackWebhookUrl)
      return badRequest("No Slack webhook URL is configured.");

    const slackRes = await fetch(settings.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "✅ Contrakt test notification — your Slack integration is working.",
      }),
    });

    if (!slackRes.ok) {
      return badRequest(
        "Slack returned an error. Check that the webhook URL is correct.",
      );
    }

    return ok({ sent: true });
  } catch (error) {
    return handleError(error);
  }
}
