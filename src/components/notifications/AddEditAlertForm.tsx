"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PeriodUnit, AlertTriggerReference, AlertChannel } from "@/types";
import type { AlertWithContract, ContractOption } from "@/lib/db/notifications";

interface AddEditAlertFormProps {
  contracts: ContractOption[];
  alert?: AlertWithContract; // present in edit mode
  onDone: () => void;
}

interface FormState {
  contractId: string;
  triggerValue: string;
  triggerUnit: PeriodUnit;
  triggerReference: AlertTriggerReference;
}

function defaultState(alert?: AlertWithContract, contracts?: ContractOption[]): FormState {
  if (alert) {
    return {
      contractId: alert.contractId,
      triggerValue: String(alert.triggerValue),
      triggerUnit: alert.triggerUnit,
      triggerReference: alert.triggerReference,
    };
  }
  return {
    contractId: contracts?.[0]?.id ?? "",
    triggerValue: "2",
    triggerUnit: PeriodUnit.Months,
    triggerReference: AlertTriggerReference.RenewalNoticeDeadline,
  };
}

const LABEL: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#171717",
  marginBottom: "4px",
  display: "block",
};

export default function AddEditAlertForm({ contracts, alert, onDone }: AddEditAlertFormProps) {
  const router = useRouter();
  const isEdit = Boolean(alert);
  const [form, setForm] = useState<FormState>(() => defaultState(alert, contracts));
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const channels: AlertChannel[] = [AlertChannel.Email];

    if (!form.contractId) { setError("Select a contract."); return; }

    const body = {
      triggerValue: Number(form.triggerValue),
      triggerUnit: form.triggerUnit,
      triggerReference: form.triggerReference,
      channels,
    };

    setError(null);
    startSave(async () => {
      const url = isEdit
        ? `/api/contracts/${alert!.contractId}/alerts/${alert!.id}`
        : `/api/contracts/${form.contractId}/alerts`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to save alert.");
        return;
      }

      router.refresh();
      onDone();
    });
  }

  const contractName = isEdit
    ? contracts.find((c) => c.id === alert!.contractId)?.vendorName ?? "Unknown contract"
    : null;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "20px",
      }}
    >
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#171717", marginBottom: "16px" }}>
        {isEdit ? "Edit alert" : "Add alert"}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        {/* Contract selector — fixed in edit mode */}
        <div>
          <label style={LABEL}>Contract</label>
          {isEdit ? (
            <p style={{ fontSize: "13px", color: "#171717", height: "32px", display: "flex", alignItems: "center" }}>
              {contractName}
            </p>
          ) : (
            <select
              value={form.contractId}
              onChange={(e) => set("contractId", e.target.value)}
              style={{ height: "32px", fontSize: "13px", width: "100%" }}
            >
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>{c.vendorName}</option>
              ))}
            </select>
          )}
        </div>

        {/* Trigger reference */}
        <div>
          <label style={LABEL}>Reference date</label>
          <select
            value={form.triggerReference}
            onChange={(e) => set("triggerReference", e.target.value as AlertTriggerReference)}
            style={{ height: "32px", fontSize: "13px", width: "100%" }}
          >
            <option value={AlertTriggerReference.RenewalNoticeDeadline}>Renewal notice deadline</option>
            <option value={AlertTriggerReference.EndDate}>End date</option>
          </select>
        </div>

        {/* Trigger timing */}
        <div>
          <label style={LABEL}>Alert timing</label>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              type="number"
              min={1}
              value={form.triggerValue}
              onChange={(e) => set("triggerValue", e.target.value)}
              style={{ width: "60px", height: "32px", fontSize: "13px" }}
            />
            <select
              value={form.triggerUnit}
              onChange={(e) => set("triggerUnit", e.target.value as PeriodUnit)}
              style={{ height: "32px", fontSize: "13px" }}
            >
              <option value={PeriodUnit.Months}>months</option>
              <option value={PeriodUnit.Days}>days</option>
            </select>
            <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)" }}>before</span>
          </div>
        </div>

      </div>

      <p style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", marginBottom: "10px" }}>
        Alerts are sent to contract owners by email.
      </p>

      {error && (
        <p style={{ fontSize: "12px", color: "#c0392b", marginBottom: "10px" }}>{error}</p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            fontSize: "13px",
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
            fontSize: "13px",
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
