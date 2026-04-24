"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import BackLink from "@/components/ui/BackLink";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import VendorEditForm from "@/components/vendors/VendorEditForm";
import { getDisplayStatus } from "@/lib/utils/contractStatus";
import { useTablePreferences } from "@/lib/hooks/useTablePreferences";
import { ContractStatus } from "@/types";
import type { VendorWithContracts, VendorContractRow } from "@/lib/db/vendors";

interface VendorDetailProps {
  vendor: VendorWithContracts;
  isAdmin: boolean;
}

// ─── Column definitions ───────────────────────────────────────────────────────
// This table is scoped to a single vendor (no Supplier column). Columns and
// their order are fixed — global View Options visibility does not apply here
// since the leading "Group entity" column plays the role of the row identifier.

const VENDOR_COLS = [
  { key: "groupEntity",           label: "Group entity",    weight: 16 },
  { key: "department",            label: "Department",      weight: 14 },
  { key: "owner",                 label: "Owner",           weight: 15 },
  { key: "endDate",               label: "End date",        weight: 13 },
  { key: "renewalNoticeDeadline", label: "Notice deadline", weight: 15 },
  { key: "status",                label: "Status",          weight: 13 },
] as const;

type VendorColKey = (typeof VENDOR_COLS)[number]["key"];
const TOTAL_WEIGHT = VENDOR_COLS.reduce((s, c) => s + c.weight, 0);

// ─── Styles ───────────────────────────────────────────────────────────────────

const TH_STYLE: React.CSSProperties = {
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

const TD_STYLE: React.CSSProperties = {
  padding: "0 16px",
  height: "40px",
  fontSize: "13px",
  color: "rgba(0,0,0,0.5)",
  borderBottom: "0.5px solid rgba(0,0,0,0.05)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// ─── Sort helpers ─────────────────────────────────────────────────────────────

const fmt = (d: Date | string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const ownerLabel = (os: VendorContractRow["owners"]) =>
  os.length === 0 ? "—" : os.length === 1 ? os[0].user.name : `${os[0].user.name} +${os.length - 1}`;

function getCellValue(col: string, c: VendorContractRow): string | number | Date | null {
  switch (col as VendorColKey) {
    case "groupEntity":           return c.groupEntity?.name.toLowerCase() ?? null;
    case "department":            return c.department.name.toLowerCase();
    case "owner":                 return ownerLabel(c.owners).toLowerCase();
    case "endDate":               return c.endDate;
    case "renewalNoticeDeadline": return c.renewalNoticeDeadline;
    case "status":                return c.status;
    default:                      return null;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VendorDetail({ vendor, isAdmin }: VendorDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  // Only sort state is used from the hook — column visibility is fixed for
  // this vendor-scoped table.
  const { sortColumn, sortDirection, setSort } = useTablePreferences("vendor_contracts");

  const filtered = useMemo(
    () => (!statusFilter ? vendor.contracts : vendor.contracts.filter((c) => c.status === statusFilter)),
    [vendor.contracts, statusFilter],
  );

  const sorted = useMemo(() => {
    if (!sortColumn) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getCellValue(sortColumn, a);
      const bv = getCellValue(sortColumn, b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;  // nulls last
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortColumn, sortDirection]);

  return (
    <div style={{ padding: "28px 32px", maxWidth: "960px" }}>
      <BackLink href="/vendors" />

      {/* Vendor header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          {isAdmin && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: "12px",
                color: "rgba(0,0,0,0.4)",
                background: "none",
                border: "0.5px solid rgba(0,0,0,0.12)",
                borderRadius: "8px",
                padding: "4px 10px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#171717"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"; }}
            >
              Edit vendor
            </button>
          )}
        </div>

        {isEditing ? (
          <div style={{ background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", padding: "20px", maxWidth: "384px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#171717", letterSpacing: "-0.01em", marginBottom: "16px" }}>Edit vendor</h2>
            <VendorEditForm vendor={vendor} onClose={() => setIsEditing(false)} />
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#171717", letterSpacing: "-0.03em", marginBottom: "12px" }}>{vendor.name}</h1>
            <dl style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
              <div>
                <dt style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>Contact name</dt>
                <dd style={{ color: "#171717" }}>{vendor.contactName || "—"}</dd>
              </div>
              <div>
                <dt style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>Contact email</dt>
                <dd style={{ color: "#171717" }}>
                  {vendor.contactEmail
                    ? <a href={`mailto:${vendor.contactEmail}`} style={{ color: "#1a7f4b", textDecoration: "none" }}>{vendor.contactEmail}</a>
                    : "—"}
                </dd>
              </div>
              <div>
                <dt style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>Contracts</dt>
                <dd style={{ color: "#171717" }}>{vendor.contracts.length}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Contract list */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#171717", letterSpacing: "-0.02em" }}>Contracts</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: "32px", fontSize: "13px" }}
          >
            <option value="">All statuses</option>
            <option value={ContractStatus.Active}>Active</option>
            <option value={ContractStatus.Expired}>Expired</option>
            <option value={ContractStatus.AutoRenewed}>Auto-renewed</option>
            <option value={ContractStatus.ActionRequired}>Action required</option>
          </select>
        </div>

        {vendor.contracts.length === 0 ? (
          <EmptyState
            heading="No contracts"
            subtext="No contracts are linked to this vendor yet."
            actionLabel="Upload a contract"
            onAction={() => window.location.assign("/contracts/new")}
          />
        ) : filtered.length === 0 ? (
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.35)", padding: "32px 0", textAlign: "center" }}>
            No contracts match the selected status.
          </p>
        ) : (
          <div style={{ background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", overflow: "hidden" }}>
            <table className="w-full table-fixed">
              <colgroup>
                {VENDOR_COLS.map((c) => (
                  <col key={c.key} style={{ width: `${((c.weight / TOTAL_WEIGHT) * 100).toFixed(1)}%` }} />
                ))}
              </colgroup>
              <thead>
                <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                  {VENDOR_COLS.map((col) => (
                    <th
                      key={col.key}
                      style={TH_STYLE}
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
                </tr>
              </thead>
              <tbody>
                {sorted.map((contract) => (
                  <tr
                    key={contract.id}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <td style={{ ...TD_STYLE, color: "#171717", fontWeight: 500 }}>
                      <Link href={`/contracts/${contract.id}`} style={{ color: "#171717", textDecoration: "none" }}>
                        {contract.groupEntity?.name || "—"}
                      </Link>
                    </td>
                    <td style={TD_STYLE}>{contract.department.name}</td>
                    <td style={TD_STYLE}>{ownerLabel(contract.owners)}</td>
                    <td style={TD_STYLE}>{fmt(contract.endDate)}</td>
                    <td style={TD_STYLE}>{fmt(contract.renewalNoticeDeadline)}</td>
                    <td style={{ ...TD_STYLE, overflow: "visible" }}>
                      <StatusBadge status={getDisplayStatus(contract)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
