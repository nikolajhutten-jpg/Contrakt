"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAccountSettings, testSlackWebhook } from "@/lib/api/settings";
import type { Tenant } from "@/types";

interface AccountSettingsFormProps {
  tenant: Tenant;
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#171717",
  marginBottom: "4px",
};

const SECTION_DESC: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(0,0,0,0.4)",
  marginBottom: "12px",
};

const FIELD_LABEL: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#171717",
  marginBottom: "4px",
  display: "block",
};

const SECTION_DIVIDER: React.CSSProperties = {
  borderBottom: "0.5px solid rgba(0,0,0,0.08)",
  paddingBottom: "24px",
  marginBottom: "24px",
};

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
    <form onSubmit={handleSave} style={{ maxWidth: "480px" }}>
      {/* Company */}
      <div style={SECTION_DIVIDER}>
        <p style={SECTION_LABEL}>Company</p>
        <p style={SECTION_DESC}>Your organisation name as it appears in Contrakt.</p>
        <label style={FIELD_LABEL}>Company name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Slack */}
      <div style={SECTION_DIVIDER}>
        <p style={SECTION_LABEL}>Slack integration</p>
        <p style={SECTION_DESC}>Used for tenant-wide renewal and status change notifications.</p>
        <label style={FIELD_LABEL}>Incoming webhook URL</label>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <input
            type="url"
            value={slackWebhookUrl}
            onChange={(e) => { setSlackWebhookUrl(e.target.value); setTestResult(null); }}
            placeholder="https://hooks.slack.com/services/…"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={handleTestSlack}
            disabled={isTesting || !slackWebhookUrl.trim()}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              padding: "7px 12px",
              background: "rgba(0,0,0,0.05)",
              color: "inherit",
              border: "0.5px solid rgba(0,0,0,0.1)",
              borderRadius: "8px",
              cursor: (isTesting || !slackWebhookUrl.trim()) ? "default" : "pointer",
              opacity: (isTesting || !slackWebhookUrl.trim()) ? 0.5 : 1,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {isTesting ? "Sending…" : "Send test"}
          </button>
        </div>
        {testResult === "success" && (
          <p className="fade-in" style={{ fontSize: "12px", color: "#1a7f4b", marginTop: "6px" }}>
            ✓ Message sent
          </p>
        )}
        {testResult === "error" && (
          <p className="fade-in" style={{ fontSize: "12px", color: "#c0392b", marginTop: "6px" }}>
            ✗ Failed — check the webhook URL
          </p>
        )}
      </div>

      {/* Tenant info */}
      <div style={{ marginBottom: "24px" }}>
        <p style={SECTION_LABEL}>Tenant</p>
        <p style={SECTION_DESC}>Read-only identifier for your workspace.</p>
        <label style={FIELD_LABEL}>Tenant slug</label>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)" }}>{tenant.slug}</p>
      </div>

      {error && <p style={{ fontSize: "12px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>}
      {saved && <p style={{ fontSize: "12px", color: "#1a7f4b", marginBottom: "12px" }}>Settings saved.</p>}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 16px",
            background: "rgba(0,0,0,0.05)",
            color: "#171717",
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: "8px",
            cursor: isPending ? "default" : "pointer",
            opacity: isPending ? 0.5 : 1,
            letterSpacing: "-0.01em",
          }}
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
