"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import ContractFormFields from "@/components/upload/ContractFormFields";
import OwnerSelect from "@/components/upload/OwnerSelect";
import ConfidenceIndicator from "@/components/upload/ConfidenceIndicator";
import type { FieldValues } from "@/components/upload/ContractFormFields";
import type { ExtractionOutput, ConfidenceRatings, Vendor, Department, User, GroupEntity } from "@/types";

interface ExtractionReviewProps {
  extracted: ExtractionOutput | null;
  confidence: ConfidenceRatings | null;
  fileName: string;
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.35)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "12px",
};

const FIELD_LABEL: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#171717",
  marginBottom: "4px",
};

function str(v: string | number | boolean | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

function ExRow({
  label,
  value,
  conf,
}: {
  label: string;
  value: string;
  conf?: React.ReactNode;
}) {
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

export default function ExtractionReview({ extracted, confidence, fileName }: ExtractionReviewProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groupEntities, setGroupEntities] = useState<GroupEntity[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [newVendorName, setNewVendorName] = useState(str(extracted?.vendor_name));
  const [departmentId, setDepartmentId] = useState("");
  const [groupEntityId, setGroupEntityId] = useState("");
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const [fields, setFields] = useState<FieldValues>({
    startDate: str(extracted?.start_date),
    endDate: str(extracted?.end_date),
    termType: str(extracted?.term_type),
    autoRenewal: extracted?.auto_renewal ?? false,
    renewalPeriodMonths: str(extracted?.renewal_period_months),
    renewalNoticePeriodValue: str(extracted?.renewal_notice_period_value),
    renewalNoticePeriodUnit: str(extracted?.renewal_notice_period_unit),
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/vendors").then((r) => r.json()) as Promise<{ data: Vendor[] }>,
      fetch("/api/departments").then((r) => r.json()) as Promise<{ data: Department[] }>,
      fetch("/api/users").then((r) => r.json()) as Promise<{ data: User[] }>,
      fetch("/api/group-entities").then((r) => r.json()) as Promise<{ data: GroupEntity[] }>,
    ]).then(([v, d, u, g]) => {
      setVendors(v.data ?? []);
      setDepartments(d.data ?? []);
      setUsers(u.data ?? []);
      setGroupEntities(g.data ?? []);
    });
  }, []);

  function handleSave() {
    setSaveError(null);
    if (!fields.startDate || !fields.endDate || !fields.termType || !departmentId) {
      setSaveError("Start date, end date, term, and department are required.");
      return;
    }
    if (fields.autoRenewal && !fields.renewalPeriodMonths) {
      setSaveError("Renewal period is required when auto-renewal is enabled.");
      return;
    }
    startSave(async () => {
      let resolvedVendorId = vendorId;
      if (!resolvedVendorId) {
        if (!newVendorName.trim()) { setSaveError("Vendor name is required."); return; }
        const vRes = await fetch("/api/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newVendorName.trim() }),
        });
        const vJson = await vRes.json() as { data?: Vendor; error?: string };
        if (!vRes.ok) { setSaveError(vJson.error ?? "Failed to create vendor."); return; }
        resolvedVendorId = vJson.data!.id;
      }
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: resolvedVendorId, departmentId,
          groupEntityId: groupEntityId || null,
          startDate: fields.startDate, endDate: fields.endDate,
          termType: fields.termType, autoRenewal: fields.autoRenewal,
          renewalPeriodMonths: fields.renewalPeriodMonths ? Number(fields.renewalPeriodMonths) : null,
          renewalNoticePeriodValue: fields.renewalNoticePeriodValue ? Number(fields.renewalNoticePeriodValue) : null,
          renewalNoticePeriodUnit: fields.renewalNoticePeriodUnit || null,
          ownerIds,
        }),
      });
      const json = await res.json() as { data?: { id: string }; error?: string };
      if (!res.ok) { setSaveError(json.error ?? "Failed to save contract."); return; }
      router.push(`/contracts/${json.data!.id}`);
    });
  }

  return (
    <div style={{ maxWidth: "960px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.02em", color: "#171717" }}>
        Review extracted details
      </h2>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "4px", marginBottom: "24px" }}>
        {fileName} · edit any field before saving
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
        <div style={{ width: "45%", paddingLeft: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={SECTION_LABEL}>Contract details</div>

          <div>
            <label style={FIELD_LABEL}>Supplier / vendor</label>
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} style={{ marginBottom: "8px" }}>
              <option value="">— Create new vendor —</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            {!vendorId && (
              <input type="text" value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="New vendor name" />
            )}
          </div>

          <div>
            <label style={FIELD_LABEL}>Group entity</label>
            <select value={groupEntityId} onChange={(e) => setGroupEntityId(e.target.value)}>
              <option value="">— None —</option>
              {groupEntities.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div>
            <label style={FIELD_LABEL}>Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Select department</option>
              {departments.filter((d) => d.isActive).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={FIELD_LABEL}>Business owners</label>
            <OwnerSelect users={users} selected={ownerIds} onChange={setOwnerIds} />
          </div>

          <ContractFormFields
            values={fields}
            confidence={confidence}
            onChange={(patch) => setFields((prev) => ({ ...prev, ...patch }))}
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
              background: "#1a7f4b",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 500,
              border: "none",
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
