"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTablePreferences } from "@/lib/hooks/useTablePreferences";
import type { AlertWithContract } from "@/lib/db/notifications";
import { AlertTriggerReference } from "@/types";

interface AlertsTableProps {
  alerts: AlertWithContract[];
  canEdit: boolean;
  onEdit: (alert: AlertWithContract) => void;
}

// ─── Column definitions ───────────────────────────────────────────────────────
// AlertsTable has a fixed column order. Columns shared with the contract tables
// respect the global visibility setting; alert-specific columns always show.

interface AlertColDef {
  key: string;
  label: string;
  weight: number;
  /** Key in the global contract-table prefs that controls visibility. */
  globalKey: string | null;
}

const ALERT_COLS: AlertColDef[] = [
  { key: "supplier",              label: "Supplier",         weight: 18, globalKey: "supplier"              },
  { key: "alertDate",             label: "Alert date",       weight: 13, globalKey: null                    },
  { key: "renewalNoticeDeadline", label: "Notice deadline",  weight: 14, globalKey: "renewalNoticeDeadline" },
  { key: "endDate",               label: "End date",         weight: 13, globalKey: "endDate"               },
  { key: "trigger",               label: "Trigger",          weight: 17, globalKey: null                    },
  { key: "alertStatus",           label: "Status",           weight: 13, globalKey: "status"                },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  padding: "0 16px",
  height: "36px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.4)",
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  cursor: "pointer",
  userSelect: "none",
};

const TD: React.CSSProperties = {
  padding: "0 16px",
  height: "40px",
  fontSize: "13px",
  color: "rgba(0,0,0,0.5)",
  borderBottom: "0.5px solid rgba(0,0,0,0.05)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REF_LABEL: Record<string, string> = {
  [AlertTriggerReference.RenewalNoticeDeadline]: "notice deadline",
  [AlertTriggerReference.EndDate]: "end date",
};

function fmt(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function triggerLabel(alert: AlertWithContract): string {
  return `${alert.triggerValue} ${alert.triggerUnit} before ${REF_LABEL[alert.triggerReference] ?? alert.triggerReference}`;
}

function getCellValue(col: string, a: AlertWithContract): string | number | Date | null {
  switch (col) {
    case "supplier":              return a.contract.vendor.name.toLowerCase();
    case "alertDate":             return a.alertDate;
    case "renewalNoticeDeadline": return a.contract.renewalNoticeDeadline;
    case "endDate":               return a.contract.endDate;
    case "trigger":               return a.triggerValue;
    case "alertStatus":           return a.sentAt ? 1 : 0;
    default:                      return null;
  }
}

// ─── Delete button ────────────────────────────────────────────────────────────

function DeleteButton({ alert }: { alert: AlertWithContract }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(true);
    await fetch(`/api/contracts/${alert.contractId}/alerts/${alert.id}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      style={{
        fontSize: "12px",
        color: deleting ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.35)",
        background: "none",
        border: "none",
        cursor: deleting ? "default" : "pointer",
        padding: "0 4px",
      }}
      onMouseEnter={(e) => {
        if (!deleting) (e.currentTarget as HTMLElement).style.color = "#c0392b";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.35)";
      }}
    >
      {deleting ? "Removing…" : "Remove"}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AlertsTable({ alerts, canEdit, onEdit }: AlertsTableProps) {
  const { visibleColumns, sortColumn, sortDirection, setSort } =
    useTablePreferences("alerts");

  // Build visible column list: alert-specific columns always show;
  // shared columns follow the global visibility preference.
  const visibleColDefs = ALERT_COLS.filter((c) =>
    c.globalKey === null || visibleColumns.includes(c.globalKey),
  );

  const actionsWeight = canEdit ? 12 : 0;
  const totalWeight =
    visibleColDefs.reduce((s, c) => s + c.weight, 0) + actionsWeight;

  const sorted = useMemo(() => {
    if (!sortColumn) return alerts;
    return [...alerts].sort((a, b) => {
      const av = getCellValue(sortColumn, a);
      const bv = getCellValue(sortColumn, b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;  // nulls last
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [alerts, sortColumn, sortDirection]);

  if (alerts.length === 0) {
    return (
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", padding: "16px 0" }}>
        No alerts to show.
      </p>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <table className="w-full table-fixed">
        <colgroup>
          {visibleColDefs.map((c) => (
            <col
              key={c.key}
              style={{ width: `${((c.weight / totalWeight) * 100).toFixed(1)}%` }}
            />
          ))}
          {canEdit && (
            <col
              style={{ width: `${((actionsWeight / totalWeight) * 100).toFixed(1)}%` }}
            />
          )}
        </colgroup>
        <thead>
          <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
            {visibleColDefs.map((col) => (
              <th
                key={col.key}
                style={TH}
                onClick={() => setSort(col.key)}
              >
                {col.label}
                {sortColumn === col.key && (
                  <span style={{ marginLeft: "3px", opacity: 0.55 }}>
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
            ))}
            {canEdit && <th style={{ ...TH, cursor: "default" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((alert) => (
            <tr
              key={alert.id}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {visibleColDefs.map((col) => {
                if (col.key === "supplier") {
                  return (
                    <td key={col.key} style={{ ...TD, color: "#171717", fontWeight: 500 }}>
                      {alert.contract.vendor.name}
                    </td>
                  );
                }
                if (col.key === "alertDate") {
                  return <td key={col.key} style={TD}>{fmt(alert.alertDate)}</td>;
                }
                if (col.key === "renewalNoticeDeadline") {
                  return <td key={col.key} style={TD}>{fmt(alert.contract.renewalNoticeDeadline)}</td>;
                }
                if (col.key === "endDate") {
                  return <td key={col.key} style={TD}>{fmt(alert.contract.endDate)}</td>;
                }
                if (col.key === "trigger") {
                  return <td key={col.key} style={TD}>{triggerLabel(alert)}</td>;
                }
                if (col.key === "alertStatus") {
                  return (
                    <td key={col.key} style={TD}>
                      {alert.sentAt ? (
                        <span style={{ color: "#1a1a1a" }}>Sent {fmt(alert.sentAt)}</span>
                      ) : (
                        <span style={{ color: "rgba(0,0,0,0.4)" }}>Scheduled</span>
                      )}
                    </td>
                  );
                }
                return null;
              })}
              {canEdit && (
                <td style={{ ...TD, overflow: "visible" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      onClick={() => onEdit(alert)}
                      style={{
                        fontSize: "12px",
                        color: "#1a1a1a",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "0 4px",
                      }}
                    >
                      Edit
                    </button>
                    <span style={{ color: "rgba(0,0,0,0.15)", fontSize: "11px" }}>·</span>
                    <DeleteButton alert={alert} />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
