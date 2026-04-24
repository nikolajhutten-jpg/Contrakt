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

const LABEL_STYLE: React.CSSProperties = {
  width: "40%",
  flexShrink: 0,
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.4)",
  paddingTop: "1px",
};

const VALUE_STYLE: React.CSSProperties = {
  flex: 1,
  fontSize: "13px",
  color: "#171717",
  minWidth: 0,
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="prop-row">
      <dt style={LABEL_STYLE}>{label}</dt>
      <dd style={VALUE_STYLE}>{value ?? "—"}</dd>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 500,
        color: "rgba(0,0,0,0.35)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        margin: "16px 0 8px",
      }}
    >
      {children}
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
    <div>
      {/* Vendor name */}
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "#171717",
          marginBottom: "16px",
        }}
      >
        {contract.vendor.name}
      </h2>

      {/* Action required banner */}
      {contract.status === ContractStatus.ActionRequired && canEdit && (
        <div
          style={{
            marginBottom: "16px",
            padding: "10px 12px",
            background: "#fdecea",
            border: "0.5px solid rgba(192,57,43,0.2)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <p style={{ fontSize: "13px", color: "#c0392b" }}>
            Action required — confirm that action has been taken.
          </p>
          <button
            onClick={confirmAction}
            disabled={confirming}
            style={{
              flexShrink: 0,
              fontSize: "12px",
              fontWeight: 500,
              padding: "4px 10px",
              background: "#c0392b",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              opacity: confirming ? 0.5 : 1,
            }}
          >
            {confirming ? "Confirming…" : "Confirm"}
          </button>
        </div>
      )}

      <dl>
        {/* Status + Supplier */}
        <Field label="Status" value={<StatusBadge status={contract.status as StatusVariant} />} />
        <Field label="Supplier" value={contract.vendor.name} />

        <SectionLabel>Parties</SectionLabel>

        {canEdit ? (
          <EditableField
            label="Department"
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
          <EditableOwnersField
            ownerIds={ownerIds}
            displayValue={ownerNames}
            users={users}
            onSave={(ids) => patch({ ownerIds: ids })}
          />
        ) : (
          <Field label="Business owners" value={ownerNames} />
        )}

        {canEdit ? (
          <EditableField
            label="Group entity"
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

        <SectionLabel>Dates</SectionLabel>

        {canEdit ? (
          <EditableField
            label="Start date"
            value={toISO(contract.startDate)}
            displayValue={fmt(contract.startDate)}
            inputType="date"
            onSave={(v) => patch({ startDate: v })}
          />
        ) : (
          <Field label="Start date" value={fmt(contract.startDate)} />
        )}

        {canEdit ? (
          <EditableField
            label="End date"
            value={toISO(contract.endDate)}
            displayValue={fmt(contract.endDate)}
            inputType="date"
            onSave={(v) => patch({ endDate: v })}
          />
        ) : (
          <Field label="End date" value={fmt(contract.endDate)} />
        )}

        <Field
          label="Duration"
          value={`${contract.durationMonths} ${contract.durationMonths === 1 ? "month" : "months"}`}
        />

        <SectionLabel>Terms</SectionLabel>

        {canEdit ? (
          <EditableField
            label="Term"
            value={contract.termType}
            displayValue={contract.termType === "fixed" ? "Fixed" : "Indefinite"}
            inputType="select"
            options={[
              { value: "fixed", label: "Fixed" },
              { value: "indefinite", label: "Indefinite" },
            ]}
            onSave={(v) => patch({ termType: v })}
          />
        ) : (
          <Field label="Term" value={contract.termType === "fixed" ? "Fixed" : "Indefinite"} />
        )}

        {canEdit ? (
          <EditableField
            label="Auto-renewal"
            value={contract.autoRenewal}
            inputType="toggle"
            onSave={(v) => patch({ autoRenewal: v })}
          />
        ) : (
          <Field label="Auto-renewal" value={contract.autoRenewal ? "Yes" : "No"} />
        )}

        {contract.autoRenewal && (canEdit ? (
          <EditableField
            label="Renewal period"
            value={contract.renewalPeriodMonths?.toString() ?? ""}
            inputType="number"
            onSave={(v) => patch({ renewalPeriodMonths: v === "" ? null : Number(v) })}
          />
        ) : (
          <Field
            label="Renewal period"
            value={contract.renewalPeriodMonths ? `${contract.renewalPeriodMonths} months` : "—"}
          />
        ))}

        <SectionLabel>Notices</SectionLabel>

        {canEdit ? (
          <EditableField
            label="Notice period"
            value={contract.renewalNoticePeriodValue?.toString() ?? ""}
            inputType="number"
            onSave={(v) => patch({ renewalNoticePeriodValue: v === "" ? null : Number(v) })}
          />
        ) : (
          <Field label="Notice period" value={noticePeriodDisplay} />
        )}

        {canEdit && (
          <EditableField
            label="Notice unit"
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

        {canEdit ? (
          <EditableField
            label="Notice deadline"
            value={contract.renewalNoticeDeadline ? toISO(contract.renewalNoticeDeadline) : ""}
            displayValue={fmt(contract.renewalNoticeDeadline)}
            inputType="date"
            onSave={(v) => patch({ renewalNoticeDeadline: v === "" ? null : v })}
          />
        ) : (
          <Field label="Notice deadline" value={fmt(contract.renewalNoticeDeadline)} />
        )}

        {contract.actionConfirmedAt && (
          <Field label="Action confirmed" value={fmt(contract.actionConfirmedAt)} />
        )}

        <SectionLabel>Metadata</SectionLabel>

        <Field label="Created" value={fmt(contract.createdAt)} />
        <Field label="Last updated" value={fmt(contract.updatedAt)} />
      </dl>
    </div>
  );
}
