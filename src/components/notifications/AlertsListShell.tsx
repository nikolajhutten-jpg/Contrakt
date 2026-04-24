"use client";

import { useState } from "react";
import AlertsTable from "@/components/notifications/AlertsTable";
import AddEditAlertForm from "@/components/notifications/AddEditAlertForm";
import BackLink from "@/components/ui/BackLink";
import type { AlertWithContract, ContractOption } from "@/lib/db/notifications";

interface AlertsListShellProps {
  title: string;
  subtitle: string;
  backHref: string;
  alerts: AlertWithContract[];
  contracts: ContractOption[];
  canEdit: boolean;
}

type FormMode = { type: "closed" } | { type: "add" } | { type: "edit"; alert: AlertWithContract };

export default function AlertsListShell({
  title,
  subtitle,
  backHref,
  alerts,
  contracts,
  canEdit,
}: AlertsListShellProps) {
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? alerts.filter((a) =>
        a.contract.vendor.name.toLowerCase().includes(search.toLowerCase()),
      )
    : alerts;

  function openAdd() { setFormMode({ type: "add" }); }
  function openEdit(alert: AlertWithContract) { setFormMode({ type: "edit", alert }); }
  function closeForm() { setFormMode({ type: "closed" }); }

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1280px" }}>
      <BackLink href={backHref} />
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "#171717",
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "3px" }}>
            {subtitle}
          </p>
        </div>
        {canEdit && formMode.type === "closed" && (
          <button
            onClick={openAdd}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              padding: "7px 16px",
              background: "rgba(0,0,0,0.05)",
              border: "0.5px solid rgba(0,0,0,0.08)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#171717",
              letterSpacing: "-0.01em",
            }}
          >
            Add alert
          </button>
        )}
      </div>

      {/* Inline form */}
      {formMode.type !== "closed" && (
        <AddEditAlertForm
          contracts={contracts}
          alert={formMode.type === "edit" ? formMode.alert : undefined}
          onDone={closeForm}
        />
      )}

      {/* Filter */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by supplier…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "280px", height: "34px", fontSize: "13px" }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              marginLeft: "8px",
              fontSize: "12px",
              color: "rgba(0,0,0,0.4)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Clear
          </button>
        )}
        <span style={{ marginLeft: "12px", fontSize: "13px", color: "rgba(0,0,0,0.35)" }}>
          {filtered.length} alert{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <AlertsTable alerts={filtered} canEdit={canEdit} onEdit={openEdit} />
    </div>
  );
}
