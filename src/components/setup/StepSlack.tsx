"use client";

import { useState, useTransition } from "react";
import { updateAccountSettings, testSlackWebhook } from "@/lib/api/settings";

interface Props {
  onComplete: () => void;
}

type TestStatus = "idle" | "testing" | "ok" | "failed";

export default function StepSlack({ onComplete }: Props) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testError, setTestError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isTesting, startTestTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  function handleTest() {
    setTestStatus("testing");
    setTestError("");

    startTestTransition(async () => {
      try {
        // Save the URL first so the test-slack endpoint can read it
        await updateAccountSettings({ slackWebhookUrl: webhookUrl.trim() });
        await testSlackWebhook();
        setTestStatus("ok");
      } catch (err) {
        setTestStatus("failed");
        setTestError(
          err instanceof Error ? err.message : "Test failed.",
        );
      }
    });
  }

  function handleSave() {
    setSaveError("");
    startSaveTransition(async () => {
      try {
        await updateAccountSettings({ slackWebhookUrl: webhookUrl.trim() || null });
        onComplete();
      } catch {
        setSaveError("Failed to save settings. Please try again.");
      }
    });
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Paste your Slack Incoming Webhook URL to receive renewal alerts and
        notifications. You can configure this later in account settings.
      </p>

      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Slack webhook URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => {
              setWebhookUrl(e.target.value);
              setTestStatus("idle");
            }}
            placeholder="https://hooks.slack.com/services/…"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            disabled={isTesting || isSaving}
          />
        </div>

        {webhookUrl.trim() && (
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || isSaving}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isTesting ? "Sending test…" : "Send test notification"}
          </button>
        )}

        {testStatus === "ok" && (
          <p className="text-sm text-green-600">
            Test notification sent successfully.
          </p>
        )}
        {testStatus === "failed" && (
          <p className="text-sm text-red-600">{testError}</p>
        )}
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onComplete}
          disabled={isSaving}
          className="flex-1 border border-gray-300 text-gray-700 text-sm py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !webhookUrl.trim()}
          className="flex-1 bg-gray-900 text-white text-sm font-medium py-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save and finish"}
        </button>
      </div>
    </div>
  );
}
