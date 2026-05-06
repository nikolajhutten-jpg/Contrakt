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
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "16px" }}>
        Paste your Slack Incoming Webhook URL to receive renewal alerts and
        notifications. You can configure this later in account settings.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#171717", marginBottom: "4px" }}>
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
            disabled={isTesting || isSaving}
          />
        </div>

        {webhookUrl.trim() && (
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || isSaving}
            style={{
              alignSelf: "flex-start",
              fontSize: "13px",
              fontWeight: 500,
              padding: "7px 12px",
              background: "rgba(0,0,0,0.05)",
              color: "#171717",
              border: "0.5px solid rgba(0,0,0,0.1)",
              borderRadius: "8px",
              cursor: (isTesting || isSaving) ? "default" : "pointer",
              opacity: (isTesting || isSaving) ? 0.5 : 1,
            }}
          >
            {isTesting ? "Sending test…" : "Send test notification"}
          </button>
        )}

        {testStatus === "ok" && (
          <p style={{ fontSize: "13px", color: "#1a1a1a" }}>
            Test notification sent successfully.
          </p>
        )}
        {testStatus === "failed" && (
          <p style={{ fontSize: "13px", color: "#c0392b" }}>{testError}</p>
        )}
        {saveError && <p style={{ fontSize: "13px", color: "#c0392b" }}>{saveError}</p>}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          type="button"
          onClick={onComplete}
          disabled={isSaving}
          style={{
            flex: 1,
            fontSize: "13px",
            fontWeight: 500,
            padding: "8px 16px",
            background: "rgba(0,0,0,0.05)",
            color: "#171717",
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: "8px",
            cursor: isSaving ? "default" : "pointer",
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !webhookUrl.trim()}
          style={{
            flex: 1,
            fontSize: "13px",
            fontWeight: 500,
            padding: "8px 16px",
            background: "#1a1a1a",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: (isSaving || !webhookUrl.trim()) ? "default" : "pointer",
            opacity: (isSaving || !webhookUrl.trim()) ? 0.5 : 1,
            letterSpacing: "-0.01em",
          }}
        >
          {isSaving ? "Saving…" : "Save and finish"}
        </button>
      </div>
    </div>
  );
}
