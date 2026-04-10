/**
 * Outbound notification helpers — email via SendGrid and Slack via Incoming Webhooks.
 * Both functions retry up to 3 times with exponential backoff per §14.3.
 * Failures are logged but never thrown — a notification failure must not crash the scheduler.
 */
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? "");

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? "noreply@contrakt.io";
const BASE_RETRY_MS = 1_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries `fn` up to 3 times with exponential backoff (1 s, 2 s, 4 s).
 * Returns true if any attempt succeeded, false after all retries are exhausted.
 */
async function retryWithBackoff(
  fn: () => Promise<void>,
  label: string,
): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await fn();
      return true;
    } catch (err) {
      // TODO: replace console.error with Sentry.captureException(err) before go-live.
      console.error(
        `[notifications] ${label} — attempt ${attempt + 1} failed:`,
        err instanceof Error ? err.message : err,
      );
      if (attempt < 2) await sleep(BASE_RETRY_MS * Math.pow(2, attempt));
    }
  }
  // TODO: replace console.error with Sentry.captureException before go-live.
  console.error(`[notifications] ${label} — all 3 attempts failed.`);
  return false;
}

/**
 * Sends a plain-text email via SendGrid.
 * §14.3: retries up to 3 times. Returns true on success, false on final failure.
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  body: string,
): Promise<boolean> {
  return retryWithBackoff(async () => {
    await sgMail.send({ to, from: FROM_EMAIL, subject, text: body });
  }, `email → ${to} "${subject}"`);
}

/**
 * Sends a Slack message via an Incoming Webhook URL.
 * §14.3: retries up to 3 times. Returns true on success, false on final failure.
 * The caller is responsible for email fallback logic when this returns false.
 */
export async function sendSlackNotification(
  webhookUrl: string,
  message: string,
): Promise<boolean> {
  return retryWithBackoff(async () => {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    if (!res.ok) {
      throw new Error(`Slack webhook responded with HTTP ${res.status}`);
    }
  }, "Slack webhook");
}
