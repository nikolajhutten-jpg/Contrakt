"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAccountSettings, testSlackWebhook } from "@/lib/api/settings";
import type { Tenant } from "@/types";

interface AccountSettingsFormProps {
  tenant: Tenant;
}

export default function AccountSettingsForm({ tenant }: AccountSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTesting] = useTransition();
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(tenant.name);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(tenant.slackWebhookUrl ?? "");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateAccountSettings({
          name: name.trim() || undefined,
          slackWebhookUrl: slackWebhookUrl.trim() || null,
        });
        setSaved(true);
        router.refresh();
      } catch {
        setError("Failed to save settings. Please try again.");
      }
    });
  }

  function handleTestSlack() {
    setTestResult(null);
    startTesting(async () => {
      try {
        await testSlackWebhook();
        setTestResult("success");
      } catch {
        setTestResult("error");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="max-w-md space-y-5">
      {/* Tenant name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Company name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {/* Slack webhook */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">
          Slack incoming webhook URL
        </label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={slackWebhookUrl}
            onChange={(e) => setSlackWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/…"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-400"
          />
          <button
            type="button"
            onClick={handleTestSlack}
            disabled={isTesting || !slackWebhookUrl.trim()}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isTesting ? "Sending…" : "Send test"}
          </button>
        </div>
        {testResult === "success" && (
          <p className="text-xs text-green-600">Test message sent successfully.</p>
        )}
        {testResult === "error" && (
          <p className="text-xs text-red-600">
            Test failed. Check that the webhook URL is correct.
          </p>
        )}
        <p className="text-xs text-gray-400">
          Used for tenant-wide renewal and status change notifications.
        </p>
      </div>

      {/* Read-only info */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Tenant slug</label>
        <p className="text-sm text-gray-500">{tenant.slug}</p>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && <p className="text-xs text-green-600">Settings saved.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
