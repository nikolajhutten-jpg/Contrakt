"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ContractFormFields from "@/components/upload/ContractFormFields";
import ConfidenceIndicator from "@/components/upload/ConfidenceIndicator";
import { useToast } from "@/lib/hooks/useToast";
import type { FieldValues } from "@/components/upload/ContractFormFields";
import type { ExtractionOutput, ConfidenceRatings, Vendor, Department, User, GroupEntity } from "@/types";

interface ExtractionReviewProps {
  extracted: ExtractionOutput | null;
  confidence: ConfidenceRatings | null;
  fileName: string;
  fileFormat: string;
  filePath: string | null;
  vendors: Vendor[];
  departments: Department[];
  groupEntities: GroupEntity[];
  users: User[];
  fields: FieldValues;
  onFieldsChange: (patch: Partial<FieldValues>) => void;
  ownerIds: string[];
  onOwnersChange: (ids: string[]) => void;
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.35)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

function str(v: string | number | boolean | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

function ExRow({ label, value, conf }: { label: string; value: string; conf?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid rgba(0,0,0,0.05)" }}>
      <span style={{ width: "45%", fontSize: "11px", fontWeight: 500, color: "rgba(0,0,0,0.4)", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ flex: 1, fontSize: "13px", color: "#171717", display: "flex", alignItems: "center", gap: "6px" }}>
        {conf}
        {value || "—"}
      </span>
    </div>
  );
}

export default function ExtractionReview({
  extracted, confidence, fileName, fileFormat, filePath,
  vendors, departments, groupEntities, users,
  fields, onFieldsChange, ownerIds, onOwnersChange,
}: ExtractionReviewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, startSave] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleSave() {
    setSaveError(null);
    if (!fields.contractName.trim()) {
      setSaveError("Contract name is required.");
      return;
    }
    if (!fields.vendorId) {
      setSaveError("Please select or create a supplier.");
      return;
    }
    if (!fields.startDate || !fields.endDate || !fields.termType || !fields.departmentId) {
      setSaveError("Start date, end date, term, and department are required.");
      return;
    }
    if (fields.autoRenewal && !fields.renewalPeriodMonths) {
      setSaveError("Renewal period is required when auto-renewal is enabled.");
      return;
    }
    startSave(async () => {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractName: fields.contractName,
          vendorId: fields.vendorId,
          departmentId: fields.departmentId,
          groupEntityId: fields.groupEntityId || null,
          startDate: fields.startDate,
          endDate: fields.endDate,
          termType: fields.termType,
          autoRenewal: fields.autoRenewal,
          renewalPeriodMonths: fields.renewalPeriodMonths ? Number(fields.renewalPeriodMonths) : null,
          renewalNoticePeriodValue: fields.renewalNoticePeriodValue ? Number(fields.renewalNoticePeriodValue) : null,
          renewalNoticePeriodUnit: fields.renewalNoticePeriodUnit || null,
          ownerIds,
        }),
      });
      const json = await res.json() as { data?: { id: string }; error?: string };
      if (!res.ok) { setSaveError(json.error ?? "Failed to save contract."); return; }

      const contractId = json.data!.id;

      if (filePath && fileFormat) {
        await fetch(`/api/contracts/${contractId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "main", fileName, filePath, fileFormat }),
        });
      }

      if (fields.alertEnabled) {
        const alertRes = await fetch(`/api/contracts/${contractId}/alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            triggerValue: fields.alertTriggerValue,
            triggerUnit: fields.alertTriggerUnit,
            triggerReference: fields.alertTriggerReference,
            channels: fields.alertChannels,
          }),
        });
        if (!alertRes.ok) {
          const body = await alertRes.json().catch(() => ({})) as { error?: string };
          showToast(body.error ?? "Alert could not be saved, but the contract was created.", "warning");
        }
      }

      router.push(`/contracts/${contractId}`);
    });
  }

  return (
    <div style={{ maxWidth: "960px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.02em", color: "#171717" }}>
        Review extracted details
      </h2>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "4px", marginBottom: "24px" }}>
        {fileName}
      </p>

      <div style={{ display: "flex" }}>
        {/* Left: AI extraction preview */}
        <div style={{ width: "55%", paddingRight: "32px", borderRight: "0.5px solid rgba(0,0,0,0.08)" }}>
          <div style={SECTION_LABEL}>Extracted by AI</div>
          {extracted ? (
            <div>
              <ExRow label="Supplier" value={str(extracted.vendor_name)} />
              <ExRow label="Start date" value={str(extracted.start_date)}
                conf={<ConfidenceIndicator level={confidence?.start_date} />} />
              <ExRow label="End date" value={str(extracted.end_date)}
                conf={<ConfidenceIndicator level={confidence?.end_date} />} />
              <ExRow label="Term" value={str(extracted.term_type)}
                conf={<ConfidenceIndicator level={confidence?.term_type} />} />
              <ExRow label="Auto-renewal" value={extracted.auto_renewal ? "Yes" : "No"}
                conf={<ConfidenceIndicator level={confidence?.auto_renewal} />} />
              {extracted.auto_renewal && (
                <>
                  <ExRow label="Renewal period" value={extracted.renewal_period_months ? `${extracted.renewal_period_months} months` : ""} />
                  <ExRow label="Notice period"
                    value={extracted.renewal_notice_period_value
                      ? `${extracted.renewal_notice_period_value} ${extracted.renewal_notice_period_unit ?? ""}`
                      : ""}
                    conf={<ConfidenceIndicator level={confidence?.renewal_notice_period_value} />}
                  />
                </>
              )}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", paddingTop: "8px" }}>
              No extraction data — fill in the details manually.
            </p>
          )}
        </div>

        {/* Right: editable form */}
        <div style={{ width: "45%", paddingLeft: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={SECTION_LABEL}>Contract details</div>

          <ContractFormFields
            values={fields}
            confidence={confidence}
            onChange={onFieldsChange}
            vendors={vendors}
            groupEntities={groupEntities}
            departments={departments.filter((d) => d.isActive)}
            users={users}
            ownerIds={ownerIds}
            onOwnersChange={onOwnersChange}
          />

          {saveError && (
            <p style={{ fontSize: "13px", color: "#c0392b" }}>{saveError}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "8px 0",
              background: "rgba(0,0,0,0.05)",
              color: "#171717",
              fontSize: "13px",
              fontWeight: 500,
              border: "0.5px solid rgba(0,0,0,0.1)",
              borderRadius: "8px",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.5 : 1,
              letterSpacing: "-0.01em",
              marginTop: "4px",
            }}
          >
            {saving ? "Saving…" : "Confirm & save"}
          </button>
        </div>
      </div>
    </div>
  );
}
