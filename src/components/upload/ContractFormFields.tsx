"use client";

import ConfidenceIndicator from "@/components/upload/ConfidenceIndicator";
import type { ConfidenceRatings } from "@/types";

export interface FieldValues {
  startDate: string;
  endDate: string;
  termType: string;
  autoRenewal: boolean;
  renewalPeriodMonths: string;
  renewalNoticePeriodValue: string;
  renewalNoticePeriodUnit: string;
}

interface ContractFormFieldsProps {
  values: FieldValues;
  confidence: ConfidenceRatings | null;
  onChange: (patch: Partial<FieldValues>) => void;
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

export default function ContractFormFields({
  values,
  confidence,
  onChange,
}: ContractFormFieldsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
            label="Notice period value"
            confidence={<ConfidenceIndicator level={confidence?.renewal_notice_period_value} />}
          >
            <input
              type="number"
              min={1}
              value={values.renewalNoticePeriodValue}
              onChange={(e) => onChange({ renewalNoticePeriodValue: e.target.value })}
              placeholder="e.g. 2"
            />
          </FieldRow>

          <FieldRow label="Notice period unit">
            <select
              value={values.renewalNoticePeriodUnit}
              onChange={(e) => onChange({ renewalNoticePeriodUnit: e.target.value })}
            >
              <option value="">Select unit</option>
              <option value="months">Months</option>
              <option value="days">Days</option>
            </select>
          </FieldRow>
        </div>
      )}
    </div>
  );
}
