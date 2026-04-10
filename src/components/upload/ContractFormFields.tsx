"use client";

import ConfidenceIndicator from "@/components/upload/ConfidenceIndicator";
import type { ConfidenceRatings } from "@/types";

export interface FieldValues {
  internalGroupEntity: string;
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
      <div className="flex items-center gap-1.5 mb-1">
        {confidence}
        <label className="text-xs font-medium text-gray-500">{label}</label>
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400";

export default function ContractFormFields({
  values,
  confidence,
  onChange,
}: ContractFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FieldRow label="Internal group entity">
        <input
          type="text"
          value={values.internalGroupEntity}
          onChange={(e) => onChange({ internalGroupEntity: e.target.value })}
          placeholder="e.g. Acme Corp Ltd"
          className={inputCls}
        />
      </FieldRow>

      <div className="grid grid-cols-2 gap-4">
        <FieldRow
          label="Start date"
          confidence={<ConfidenceIndicator level={confidence?.start_date} />}
        >
          <input
            type="date"
            value={values.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className={inputCls}
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
            className={inputCls}
          />
        </FieldRow>
      </div>

      <FieldRow
        label="Term type"
        confidence={<ConfidenceIndicator level={confidence?.term_type} />}
      >
        <select
          value={values.termType}
          onChange={(e) => onChange({ termType: e.target.value })}
          className={inputCls}
        >
          <option value="">Select term type</option>
          <option value="fixed">Fixed</option>
          <option value="indefinite">Indefinite</option>
        </select>
      </FieldRow>

      <FieldRow
        label="Auto-renewal"
        confidence={<ConfidenceIndicator level={confidence?.auto_renewal} />}
      >
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={values.autoRenewal}
            onChange={(e) => onChange({ autoRenewal: e.target.checked })}
            className="rounded border-gray-300"
          />
          Yes, this contract auto-renews
        </label>
      </FieldRow>

      {values.autoRenewal && (
        <FieldRow label="Renewal period (months)">
          <input
            type="number"
            min={1}
            value={values.renewalPeriodMonths}
            onChange={(e) => onChange({ renewalPeriodMonths: e.target.value })}
            placeholder="e.g. 12"
            className={inputCls}
          />
        </FieldRow>
      )}

      <div className="grid grid-cols-2 gap-4">
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
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="Notice period unit">
          <select
            value={values.renewalNoticePeriodUnit}
            onChange={(e) => onChange({ renewalNoticePeriodUnit: e.target.value })}
            className={inputCls}
          >
            <option value="">Select unit</option>
            <option value="months">Months</option>
            <option value="days">Days</option>
          </select>
        </FieldRow>
      </div>
    </div>
  );
}
