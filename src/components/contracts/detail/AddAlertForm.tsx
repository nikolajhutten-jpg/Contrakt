"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PeriodUnit, AlertTriggerReference, AlertChannel } from "@/types";

interface AddAlertFormProps {
  contractId: string;
  onDone: () => void;
}

interface FormState {
  triggerValue: string;
  triggerUnit: PeriodUnit;
  triggerReference: AlertTriggerReference;
  emailChannel: boolean;
  slackChannel: boolean;
}

const DEFAULT: FormState = {
  triggerValue: "2",
  triggerUnit: PeriodUnit.Months,
  triggerReference: AlertTriggerReference.RenewalNoticeDeadline,
  emailChannel: true,
  slackChannel: false,
};

export default function AddAlertForm({ contractId, onDone }: AddAlertFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT);
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const channels: AlertChannel[] = [];
    if (form.emailChannel) channels.push(AlertChannel.Email);
    if (form.slackChannel) channels.push(AlertChannel.Slack);

    if (channels.length === 0) {
      setError("Select at least one channel.");
      return;
    }

    setError(null);
    startSave(async () => {
      const res = await fetch(`/api/contracts/${contractId}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          triggerValue: Number(form.triggerValue),
          triggerUnit: form.triggerUnit,
          triggerReference: form.triggerReference,
          channels,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "Failed to save alert.");
        return;
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
      {/* Timing row */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
        <input
          type="number"
          min={1}
          value={form.triggerValue}
          onChange={(e) => setForm({ ...form, triggerValue: e.target.value })}
          style={{ width: "56px", height: "30px", fontSize: "13px" }}
        />
        <select
          value={form.triggerUnit}
          onChange={(e) => setForm({ ...form, triggerUnit: e.target.value as PeriodUnit })}
          style={{ height: "30px", fontSize: "13px" }}
        >
          <option value={PeriodUnit.Months}>months</option>
          <option value={PeriodUnit.Days}>days</option>
        </select>
        <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)" }}>before</span>
        <select
          value={form.triggerReference}
          onChange={(e) =>
            setForm({ ...form, triggerReference: e.target.value as AlertTriggerReference })
          }
          style={{ height: "30px", fontSize: "13px" }}
        >
          <option value={AlertTriggerReference.RenewalNoticeDeadline}>renewal notice deadline</option>
          <option value={AlertTriggerReference.EndDate}>end date</option>
        </select>
      </div>

      {/* Channels */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#171717", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={form.emailChannel}
            onChange={(e) => setForm({ ...form, emailChannel: e.target.checked })}
          />
          Email
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#171717", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={form.slackChannel}
            onChange={(e) => setForm({ ...form, slackChannel: e.target.checked })}
          />
          Slack
        </label>
      </div>

      {error && (
        <p style={{ fontSize: "12px", color: "#c0392b", marginBottom: "8px" }}>{error}</p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: saving ? "rgba(0,0,0,0.3)" : "#1a7f4b",
            background: "none",
            border: "none",
            cursor: saving ? "default" : "pointer",
            padding: 0,
          }}
        >
          {saving ? "Saving…" : "Save alert"}
        </button>
        <button
          onClick={onDone}
          style={{
            fontSize: "12px",
            color: "rgba(0,0,0,0.35)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
