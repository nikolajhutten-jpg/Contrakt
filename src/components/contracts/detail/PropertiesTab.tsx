"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import EditableField from "@/components/contracts/detail/EditableField";
import EditableOwnersField from "@/components/contracts/detail/EditableOwnersField";
import type { ContractWithRelations, Department, GroupEntity, User } from "@/types";
import { ContractStatus } from "@/types";
import type { StatusVariant } from "@/components/ui/StatusBadge";

interface PropertiesTabProps {
  contract: ContractWithRelations;
  canEdit: boolean;
}

const fmt = (d: Date | null | undefined): string =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const toISO = (d: Date): string => new Date(d).toISOString().slice(0, 10);

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}

export default function PropertiesTab({ contract, canEdit }: PropertiesTabProps) {
  const router = useRouter();
  const [confirming, startConfirm] = useTransition();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groupEntities, setGroupEntities] = useState<GroupEntity[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!canEdit) return;
    Promise.all([
      fetch("/api/departments").then((r) => r.json()) as Promise<{ data: Department[] }>,
      fetch("/api/group-entities").then((r) => r.json()) as Promise<{ data: GroupEntity[] }>,
      fetch("/api/users").then((r) => r.json()) as Promise<{ data: User[] }>,
    ]).then(([d, g, u]) => {
      setDepartments(d.data ?? []);
      setGroupEntities(g.data ?? []);
      setUsers(u.data ?? []);
    });
  }, [canEdit]);

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/contracts/${contract.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  function confirmAction() {
    startConfirm(async () => {
      await fetch(`/api/contracts/${contract.id}/confirm-action`, { method: "POST" });
      router.refresh();
    });
  }

  const ownerNames =
    contract.owners.length === 0 ? "—" : contract.owners.map((o) => o.user.name).join(", ");
  const ownerIds = contract.owners.map((o) => o.userId);

  const noticePeriodDisplay =
    contract.renewalNoticePeriodValue && contract.renewalNoticePeriodUnit
      ? `${contract.renewalNoticePeriodValue} ${contract.renewalNoticePeriodUnit}`
      : "—";

  return (
    <div className="overflow-y-auto">
      {contract.status === ContractStatus.ActionRequired && canEdit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center justify-between gap-3">
          <p className="text-sm text-red-700">Action required — confirm that action has been taken.</p>
          <button onClick={confirmAction} disabled={confirming}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors">
            {confirming ? "Confirming…" : "Confirm action taken"}
          </button>
        </div>
      )}

      <dl>
        <Field label="Status" value={<StatusBadge status={contract.status as StatusVariant} />} />
        <Field label="Supplier" value={contract.vendor.name} />

        {canEdit ? (
          <EditableField label="Department"
            value={contract.departmentId}
            displayValue={contract.department.name}
            inputType="select"
            options={departments.filter((d) => d.isActive).map((d) => ({ value: d.id, label: d.name }))}
            onSave={(v) => patch({ departmentId: v })}
          />
        ) : (
          <Field label="Department" value={contract.department.name} />
        )}

        {canEdit ? (
          <EditableOwnersField ownerIds={ownerIds} displayValue={ownerNames} users={users}
            onSave={(ids) => patch({ ownerIds: ids })}
          />
        ) : (
          <Field label="Business owners" value={ownerNames} />
        )}

        {canEdit ? (
          <EditableField label="Group entity"
            value={contract.groupEntityId ?? ""}
            displayValue={contract.groupEntity?.name ?? "—"}
            inputType="select"
            options={[
              { value: "", label: "— None —" },
              ...groupEntities.map((g) => ({ value: g.id, label: g.name })),
            ]}
            onSave={(v) => patch({ groupEntityId: String(v) || null })}
          />
        ) : (
          <Field label="Group entity" value={contract.groupEntity?.name ?? "—"} />
        )}

        {canEdit ? (
          <EditableField label="Start date" value={toISO(contract.startDate)}
            displayValue={fmt(contract.startDate)} inputType="date"
            onSave={(v) => patch({ startDate: v })}
          />
        ) : (
          <Field label="Start date" value={fmt(contract.startDate)} />
        )}

        {canEdit ? (
          <EditableField label="End date" value={toISO(contract.endDate)}
            displayValue={fmt(contract.endDate)} inputType="date"
            onSave={(v) => patch({ endDate: v })}
          />
        ) : (
          <Field label="End date" value={fmt(contract.endDate)} />
        )}

        <Field label="Duration"
          value={`${contract.durationMonths} ${contract.durationMonths === 1 ? "month" : "months"}`}
        />

        {canEdit ? (
          <EditableField label="Term" value={contract.termType}
            displayValue={contract.termType === "fixed" ? "Fixed" : "Indefinite"}
            inputType="select"
            options={[{ value: "fixed", label: "Fixed" }, { value: "indefinite", label: "Indefinite" }]}
            onSave={(v) => patch({ termType: v })}
          />
        ) : (
          <Field label="Term" value={contract.termType === "fixed" ? "Fixed" : "Indefinite"} />
        )}

        {canEdit ? (
          <EditableField label="Auto-renewal" value={contract.autoRenewal} inputType="toggle"
            onSave={(v) => patch({ autoRenewal: v })}
          />
        ) : (
          <Field label="Auto-renewal" value={contract.autoRenewal ? "Yes" : "No"} />
        )}

        {contract.autoRenewal && (canEdit ? (
          <EditableField label="Renewal period (months)"
            value={contract.renewalPeriodMonths?.toString() ?? ""} inputType="number"
            onSave={(v) => patch({ renewalPeriodMonths: v === "" ? null : Number(v) })}
          />
        ) : (
          <Field label="Renewal period"
            value={contract.renewalPeriodMonths ? `${contract.renewalPeriodMonths} months` : "—"}
          />
        ))}

        {canEdit ? (
          <EditableField label="Notice period value"
            value={contract.renewalNoticePeriodValue?.toString() ?? ""} inputType="number"
            onSave={(v) => patch({ renewalNoticePeriodValue: v === "" ? null : Number(v) })}
          />
        ) : (
          <Field label="Notice period" value={noticePeriodDisplay} />
        )}

        {canEdit && (
          <EditableField label="Notice period unit"
            value={contract.renewalNoticePeriodUnit ?? ""}
            displayValue={contract.renewalNoticePeriodUnit ?? "—"}
            inputType="select"
            options={[
              { value: "", label: "— None —" },
              { value: "months", label: "Months" },
              { value: "days", label: "Days" },
            ]}
            onSave={(v) => patch({ renewalNoticePeriodUnit: String(v) || null })}
          />
        )}

        <Field label="Notice deadline" value={fmt(contract.renewalNoticeDeadline)} />
        {contract.actionConfirmedAt && (
          <Field label="Action confirmed" value={fmt(contract.actionConfirmedAt)} />
        )}
        <Field label="Created" value={fmt(contract.createdAt)} />
        <Field label="Last updated" value={fmt(contract.updatedAt)} />
      </dl>
    </div>
  );
}
