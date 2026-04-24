"use client";

import { useState } from "react";
import Link from "next/link";
import AlertsTable from "@/components/notifications/AlertsTable";
import AddEditAlertForm from "@/components/notifications/AddEditAlertForm";
import type { AlertWithContract, ContractOption } from "@/lib/db/notifications";

interface NotificationsShellProps {
  upcomingAlerts: AlertWithContract[];
  sentAlerts: AlertWithContract[];
  contracts: ContractOption[];
  canEdit: boolean;
}

type FormMode = { type: "closed" } | { type: "add" } | { type: "edit"; alert: AlertWithContract };

function SectionHeader({
  title,
  count,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  count: number;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#171717" }}>{title}</h2>
        <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)" }}>
          {count} alert{count !== 1 ? "s" : ""}
        </span>
      </div>
      <Link
        href={viewAllHref}
        style={{ fontSize: "13px", color: "#171717", textDecoration: "none" }}
      >
        {viewAllLabel}
      </Link>
    </div>
  );
}

export default function NotificationsShell({
  upcomingAlerts,
  sentAlerts,
  contracts,
  canEdit,
}: NotificationsShellProps) {
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });

  function openAdd() { setFormMode({ type: "add" }); }
  function openEdit(alert: AlertWithContract) { setFormMode({ type: "edit", alert }); }
  function closeForm() { setFormMode({ type: "closed" }); }

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1280px" }}>
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
            Notifications
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "3px" }}>
            Renewal alerts across your contracts
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

      {/* Inline form (add or edit) */}
      {formMode.type !== "closed" && (
        <AddEditAlertForm
          contracts={contracts}
          alert={formMode.type === "edit" ? formMode.alert : undefined}
          onDone={closeForm}
        />
      )}

      {/* Upcoming section */}
      <div style={{ marginBottom: "32px" }}>
        <SectionHeader
          title="Upcoming"
          count={upcomingAlerts.length}
          viewAllHref="/notifications/upcoming"
          viewAllLabel="View all upcoming →"
        />
        <AlertsTable alerts={upcomingAlerts} canEdit={canEdit} onEdit={openEdit} />
      </div>

      {/* Recent / Sent section */}
      <div>
        <SectionHeader
          title="Recent"
          count={sentAlerts.length}
          viewAllHref="/notifications/sent"
          viewAllLabel="View all sent →"
        />
        <AlertsTable alerts={sentAlerts} canEdit={canEdit} onEdit={openEdit} />
      </div>
    </div>
  );
}
