"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import { getDisplayStatus } from "@/lib/utils/contractStatus";
import { useTablePreferences, ALL_CONTRACT_COLUMNS } from "@/lib/hooks/useTablePreferences";
import type { ContractSummary } from "@/types";

interface ActionRequiredShellProps {
  contracts: ContractSummary[];
}

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

// ─── Cell helpers ─────────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function ownerNames(owners: { name: string }[]): string {
  if (owners.length === 0) return "—";
  if (owners.length === 1) return owners[0].name;
  return `${owners[0].name} +${owners.length - 1}`;
}

function getCellValue(col: string, c: ContractSummary): string | number | Date | null {
  switch (col) {
    case "supplier":              return c.vendor.name.toLowerCase();
    case "department":            return c.department.name.toLowerCase();
    case "owner":                 return ownerNames(c.owners).toLowerCase();
    case "startDate":             return c.startDate;
    case "endDate":               return c.endDate;
    case "renewalNoticeDeadline": return c.renewalNoticeDeadline;
    case "autoRenewal":           return c.autoRenewal ? 1 : 0;
    case "status":                return getDisplayStatus(c);
    case "groupEntity":           return c.groupEntity?.name.toLowerCase() ?? null;
    case "termType":              return c.termType;
    case "durationMonths":        return c.durationMonths;
    default:                      return null;
  }
}

function renderCell(col: string, c: ContractSummary): React.ReactNode {
  switch (col) {
    case "supplier":              return c.vendor.name;
    case "department":            return c.department.name;
    case "owner":                 return ownerNames(c.owners);
    case "startDate":             return formatDate(c.startDate);
    case "endDate":               return formatDate(c.endDate);
    case "renewalNoticeDeadline": return formatDate(c.renewalNoticeDeadline);
    case "autoRenewal":           return c.autoRenewal ? "Yes" : "No";
    case "status":                return <StatusBadge status={getDisplayStatus(c)} />;
    case "groupEntity":           return c.groupEntity?.name ?? "—";
    case "termType":              return c.termType === "fixed" ? "Fixed" : "Indefinite";
    case "durationMonths":        return `${c.durationMonths}mo`;
    default:                      return null;
  }
}

function getCellStyle(col: string): React.CSSProperties {
  if (col === "supplier") return { ...TD_STYLE, color: "#171717", fontWeight: 500 };
  if (col === "status")   return { ...TD_STYLE, overflow: "visible", whiteSpace: "nowrap" };
  return TD_STYLE;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ActionRequiredShell({
  contracts: initialContracts,
}: ActionRequiredShellProps) {
  const router = useRouter();
  const [contracts] = useState(initialContracts);

  const { visibleColumns, sortColumn, sortDirection, setSort } =
    useTablePreferences("action_required");

  // Preserve server order (renewalNoticeDeadline ASC nulls last, endDate ASC)
  // when no sort is active.
  const sorted = useMemo(() => {
    if (!sortColumn) return contracts;
    return [...contracts].sort((a, b) => {
      const av = getCellValue(sortColumn, a);
      const bv = getCellValue(sortColumn, b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;  // nulls last
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [contracts, sortColumn, sortDirection]);

  const visibleColDefs = ALL_CONTRACT_COLUMNS.filter((c) => visibleColumns.includes(c.key));
  const totalWeight = visibleColDefs.reduce((s, c) => s + c.weight, 0);

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1280px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "-0.03em", color: "#171717" }}>
          Upcoming renewals
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "3px" }}>
          Contracts that need your attention
        </p>
      </div>

      {contracts.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "0.5px solid rgba(0,0,0,0.08)",
            borderRadius: "12px",
            padding: "48px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "#171717", marginBottom: "4px" }}>
            No upcoming renewals
          </p>
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)" }}>
            All contracts are up to date
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginBottom: "10px" }}>
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""} require attention
          </p>

          <div style={{ background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", overflow: "hidden" }}>
            <table className="w-full table-fixed">
              <colgroup>
                {visibleColDefs.map((c) => (
                  <col
                    key={c.key}
                    style={{ width: `${((c.weight / totalWeight) * 100).toFixed(1)}%` }}
                  />
                ))}
              </colgroup>
              <thead>
                <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                  {visibleColDefs.map((col) => (
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
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {visibleColDefs.map((col) => (
                      <td key={col.key} style={getCellStyle(col.key)}>
                        {renderCell(col.key, contract)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
