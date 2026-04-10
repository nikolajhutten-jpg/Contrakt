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
    <div className="mt-4 p-4 border border-gray-200 rounded bg-gray-50 space-y-3">
      <h4 className="text-sm font-medium text-gray-900">Add alert</h4>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="number"
          min={1}
          value={form.triggerValue}
          onChange={(e) => setForm({ ...form, triggerValue: e.target.value })}
          className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
        <select
          value={form.triggerUnit}
          onChange={(e) =>
            setForm({ ...form, triggerUnit: e.target.value as PeriodUnit })
          }
          className="px-2 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value={PeriodUnit.Months}>months</option>
          <option value={PeriodUnit.Days}>days</option>
        </select>
        <span className="text-sm text-gray-500">before</span>
        <select
          value={form.triggerReference}
          onChange={(e) =>
            setForm({
              ...form,
              triggerReference: e.target.value as AlertTriggerReference,
            })
          }
          className="px-2 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value={AlertTriggerReference.RenewalNoticeDeadline}>
            renewal notice deadline
          </option>
          <option value={AlertTriggerReference.EndDate}>end date</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.emailChannel}
            onChange={(e) =>
              setForm({ ...form, emailChannel: e.target.checked })
            }
            className="rounded border-gray-300"
          />
          Email
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.slackChannel}
            onChange={(e) =>
              setForm({ ...form, slackChannel: e.target.checked })
            }
            className="rounded border-gray-300"
          />
          Slack
        </label>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save alert"}
        </button>
        <button
          onClick={onDone}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
