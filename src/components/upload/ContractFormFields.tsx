"use client";

import ComboSelect from "@/components/ui/ComboSelect";
import OwnerSelect from "@/components/upload/OwnerSelect";
import ConfidenceIndicator from "@/components/upload/ConfidenceIndicator";
import type { ConfidenceRatings, User } from "@/types";

async function postUser(name: string): Promise<User> {
  const res = await fetch("/api/users/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email: `invite-${Date.now()}@placeholder.local`,
      role: "business_owner",
    }),
  });
  const json = await res.json() as { data?: User; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Failed to create user.");
  return json.data!;
}

export interface FieldValues {
  vendorId: string | null;
  groupEntityId: string | null;
  departmentId: string | null;
  startDate: string;
  endDate: string;
  termType: string;
  autoRenewal: boolean;
  renewalPeriodMonths: string;
  renewalNoticePeriodValue: string;
  renewalNoticePeriodUnit: string;
  alertEnabled: boolean;
  alertTriggerValue: number;
  alertTriggerUnit: 'months' | 'days';
  alertTriggerReference: 'renewal_notice_deadline' | 'end_date';
  alertChannels: string[];
}

interface Option { id: string; name: string; }

interface ContractFormFieldsProps {
  values: FieldValues;
  confidence: ConfidenceRatings | null;
  onChange: (patch: Partial<FieldValues>) => void;
  vendors: Option[];
  groupEntities: Option[];
  departments: Option[];
  users: User[];
  ownerIds: string[];
  onOwnersChange: (ids: string[]) => void;
}

function FieldRow({
  label,
  confidence,
  children,
}: {
  label: string;
  confidence?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
        <label style={{ fontSize: "12px", fontWeight: 500, color: "#171717" }}>{label}</label>
        {confidence}
      </div>
      {children}
    </div>
  );
}

async function postOption(path: string, name: string): Promise<Option> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const json = await res.json() as { data?: Option; error?: string };
  if (!res.ok) throw new Error(json.error ?? `Failed to create entry.`);
  return json.data!;
}

export default function ContractFormFields({
  values,
  confidence,
  onChange,
  vendors,
  groupEntities,
  departments,
  users,
  ownerIds,
  onOwnersChange,
}: ContractFormFieldsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <FieldRow label="Supplier / vendor">
        <ComboSelect
          options={vendors}
          value={values.vendorId}
          onChange={(id) => onChange({ vendorId: id })}
          onCreateNew={(name) => postOption("/api/vendors", name)}
          placeholder="Search or create vendor…"
        />
      </FieldRow>

      <FieldRow label="Group entity">
        <select
          value={values.groupEntityId ?? ""}
          onChange={(e) => onChange({ groupEntityId: e.target.value || null })}
        >
          <option value="">Select group entity</option>
          {groupEntities.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label="Department">
        <select
          value={values.departmentId ?? ""}
          onChange={(e) => onChange({ departmentId: e.target.value || null })}
        >
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label="Business owners">
        <OwnerSelect users={users} selected={ownerIds} onChange={onOwnersChange} onCreateNew={postUser} />
      </FieldRow>

      <FieldRow
        label="Start date"
        confidence={<ConfidenceIndicator level={confidence?.start_date} />}
      >
        <input
          type="date"
          value={values.startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </FieldRow>

      <FieldRow
        label="End date"
        confidence={<ConfidenceIndicator level={confidence?.end_date} />}
      >
        <input
          type="date"
          value={values.endDate}
          onChange={(e) => onChange({ endDate: e.target.value })}
        />
      </FieldRow>

      <FieldRow
        label="Term"
        confidence={<ConfidenceIndicator level={confidence?.term_type} />}
      >
        <select
          value={values.termType}
          onChange={(e) => onChange({ termType: e.target.value })}
        >
          <option value="">Select term</option>
          <option value="fixed">Fixed</option>
          <option value="indefinite">Indefinite</option>
        </select>
      </FieldRow>

      <FieldRow
        label="Auto-renewal"
        confidence={<ConfidenceIndicator level={confidence?.auto_renewal} />}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => onChange({ autoRenewal: v, ...(!v && { renewalPeriodMonths: "" }) })}
              style={{
                padding: "3px 12px",
                fontSize: "12px",
                fontWeight: 500,
                borderRadius: "20px",
                border: "0.5px solid rgba(0,0,0,0.1)",
                cursor: "pointer",
                background: values.autoRenewal === v ? "#1a7f4b" : "rgba(0,0,0,0.05)",
                color: values.autoRenewal === v ? "#ffffff" : "rgba(0,0,0,0.5)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {v ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </FieldRow>

      {values.autoRenewal && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <FieldRow label="Renewal period (months)">
            <input
              type="number"
              min={1}
              value={values.renewalPeriodMonths}
              onChange={(e) => onChange({ renewalPeriodMonths: e.target.value })}
              placeholder="e.g. 12"
            />
          </FieldRow>

          <FieldRow
            label="Notice period"
            confidence={<ConfidenceIndicator level={confidence?.renewal_notice_period_value} />}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                type="number"
                min={1}
                value={values.renewalNoticePeriodValue}
                onChange={(e) => onChange({ renewalNoticePeriodValue: e.target.value })}
                placeholder="e.g. 2"
              />
              <select
                value={values.renewalNoticePeriodUnit}
                onChange={(e) => onChange({ renewalNoticePeriodUnit: e.target.value })}
              >
                <option value="">Select unit</option>
                <option value="months">Months</option>
                <option value="days">Days</option>
              </select>
            </div>
          </FieldRow>
        </div>
      )}

      <FieldRow label="Set up alert">
        <div style={{ display: "flex", gap: "4px" }}>
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => onChange({ alertEnabled: v })}
              style={{
                padding: "3px 12px",
                fontSize: "12px",
                fontWeight: 500,
                borderRadius: "20px",
                border: "0.5px solid rgba(0,0,0,0.1)",
                cursor: "pointer",
                background: values.alertEnabled === v ? "#1a7f4b" : "rgba(0,0,0,0.05)",
                color: values.alertEnabled === v ? "#ffffff" : "rgba(0,0,0,0.5)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {v ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </FieldRow>

      {values.alertEnabled && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <FieldRow label="Send alert">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                type="number"
                min={1}
                value={values.alertTriggerValue}
                onChange={(e) => onChange({ alertTriggerValue: Math.max(1, Number(e.target.value)) })}
              />
              <select
                value={values.alertTriggerUnit}
                onChange={(e) => onChange({ alertTriggerUnit: e.target.value as 'months' | 'days' })}
              >
                <option value="months">Months</option>
                <option value="days">Days</option>
              </select>
            </div>
          </FieldRow>

          <FieldRow label="Before">
            <select
              value={values.alertTriggerReference}
              onChange={(e) => onChange({ alertTriggerReference: e.target.value as 'renewal_notice_deadline' | 'end_date' })}
            >
              <option value="renewal_notice_deadline">Renewal notice deadline</option>
              <option value="end_date">Contract end date</option>
            </select>
          </FieldRow>

          <FieldRow label="Notify via">
            <div style={{ display: "flex", gap: "12px" }}>
              {(["email", "slack"] as const).map((ch) => (
                <label key={ch} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={values.alertChannels.includes(ch)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...values.alertChannels, ch]
                        : values.alertChannels.filter((c) => c !== ch);
                      onChange({ alertChannels: next });
                    }}
                  />
                  {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </label>
              ))}
            </div>
          </FieldRow>
        </div>
      )}
    </div>
  );
}
