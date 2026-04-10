"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import ContractFormFields from "@/components/upload/ContractFormFields";
import OwnerSelect from "@/components/upload/OwnerSelect";
import type { FieldValues } from "@/components/upload/ContractFormFields";
import type { ExtractionOutput, ConfidenceRatings, Vendor, Department, User, GroupEntity } from "@/types";

interface ExtractionReviewProps {
  extracted: ExtractionOutput | null;
  confidence: ConfidenceRatings | null;
  fileName: string;
}

function str(v: string | number | boolean | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
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
          vendorId: resolvedVendorId,
          departmentId,
          groupEntityId: groupEntityId || null,
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
      router.push(`/contracts/${json.data!.id}`);
    });
  }

  const sel = "w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-medium text-gray-900">Contract details</h2>
        <p className="text-xs text-gray-400 mt-0.5">{fileName} · edit any field before saving</p>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">
          Supplier / vendor
        </label>
        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={`${sel} mb-2`}>
          <option value="">— Create new vendor —</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        {!vendorId && (
          <input type="text" value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)}
            placeholder="New vendor name" className={sel} />
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Group entity</label>
        <select value={groupEntityId} onChange={(e) => setGroupEntityId(e.target.value)} className={sel}>
          <option value="">— None —</option>
          {groupEntities.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={sel}>
          <option value="">Select department</option>
          {departments.filter((d) => d.isActive).map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Business owners</label>
        <OwnerSelect users={users} selected={ownerIds} onChange={setOwnerIds} />
      </div>

      <ContractFormFields
        values={fields}
        confidence={confidence}
        onChange={(patch) => setFields((prev) => ({ ...prev, ...patch }))}
      />

      {saveError && <p className="text-sm text-red-600">{saveError}</p>}

      <button onClick={handleSave} disabled={saving}
        className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        {saving ? "Saving…" : "Confirm & save"}
      </button>
    </div>
  );
}
