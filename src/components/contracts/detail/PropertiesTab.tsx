"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import EditableField from "@/components/contracts/detail/EditableField";
import type { ContractWithRelations } from "@/types";
import { ContractStatus } from "@/types";
import type { StatusVariant } from "@/components/ui/StatusBadge";

interface PropertiesTabProps {
  contract: ContractWithRelations;
  canEdit: boolean;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

  async function patchField(field: string, value: string) {
    await fetch(`/api/contracts/${contract.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    router.refresh();
  }

  function confirmAction() {
    startConfirm(async () => {
      await fetch(`/api/contracts/${contract.id}/confirm-action`, {
        method: "POST",
      });
      router.refresh();
    });
  }

  const ownerNames =
    contract.owners.length === 0
      ? "—"
      : contract.owners.map((o) => o.user.name).join(", ");

  const toDateInput = (d: Date) =>
    new Date(d).toISOString().slice(0, 10);

  return (
    <div className="overflow-y-auto">
      {contract.status === ContractStatus.ActionRequired && canEdit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center justify-between gap-3">
          <p className="text-sm text-red-700">
            Action required — confirm that action has been taken.
          </p>
          <button
            onClick={confirmAction}
            disabled={confirming}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {confirming ? "Confirming…" : "Confirm action taken"}
          </button>
        </div>
      )}

      <dl>
        <Field label="Status" value={<StatusBadge status={contract.status as StatusVariant} />} />
        <Field label="Supplier" value={contract.vendor.name} />
        <Field label="Department" value={contract.department.name} />
        <Field label="Business owners" value={ownerNames} />

        {canEdit ? (
          <EditableField
            label="Internal group entity"
            value={contract.internalGroupEntity}
            onSave={(v) => patchField("internalGroupEntity", v)}
          />
        ) : (
          <Field label="Internal group entity" value={contract.internalGroupEntity} />
        )}

        {canEdit ? (
          <EditableField
            label="Start date"
            value={toDateInput(contract.startDate)}
            inputType="date"
            onSave={(v) => patchField("startDate", v)}
          />
        ) : (
          <Field label="Start date" value={formatDate(contract.startDate)} />
        )}

        {canEdit ? (
          <EditableField
            label="End date"
            value={toDateInput(contract.endDate)}
            inputType="date"
            onSave={(v) => patchField("endDate", v)}
          />
        ) : (
          <Field label="End date" value={formatDate(contract.endDate)} />
        )}

        <Field label="Duration" value={`${contract.durationMonths} month${contract.durationMonths !== 1 ? "s" : ""}`} />
        <Field label="Term type" value={contract.termType === "fixed" ? "Fixed" : "Indefinite"} />
        <Field label="Auto-renewal" value={contract.autoRenewal ? "Yes" : "No"} />
        <Field label="Renewal period" value={contract.renewalPeriodMonths ? `${contract.renewalPeriodMonths} months` : null} />
        <Field
          label="Renewal notice period"
          value={
            contract.renewalNoticePeriodValue && contract.renewalNoticePeriodUnit
              ? `${contract.renewalNoticePeriodValue} ${contract.renewalNoticePeriodUnit}`
              : null
          }
        />
        <Field label="Renewal notice deadline" value={formatDate(contract.renewalNoticeDeadline)} />
        {contract.actionConfirmedAt && (
          <Field label="Action confirmed at" value={formatDate(contract.actionConfirmedAt)} />
        )}
        <Field label="Created" value={formatDate(contract.createdAt)} />
        <Field label="Last updated" value={formatDate(contract.updatedAt)} />
      </dl>
    </div>
  );
}
