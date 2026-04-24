"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import { getDisplayStatus } from "@/lib/utils/contractStatus";
import { useTablePreferences, ALL_CONTRACT_COLUMNS } from "@/lib/hooks/useTablePreferences";
import type { ContractSummary } from "@/types";

interface ContractTableProps {
  contracts: ContractSummary[];
  showFilter?: boolean;
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

export default function ContractTable({
  contracts,
  showFilter = true,
}: ContractTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { visibleColumns, sortColumn, sortDirection, setSort } =
    useTablePreferences("dashboard_contracts");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter(
      (c) =>
        c.vendor.name.toLowerCase().includes(q) ||
        c.department.name.toLowerCase().includes(q) ||
        (c.groupEntity?.name ?? "").toLowerCase().includes(q) ||
        c.owners.some((o) => o.name.toLowerCase().includes(q)),
    );
  }, [contracts, query]);

  // When sortColumn is null, preserve the server's default order
  // (renewalNoticeDeadline ASC nulls last, endDate ASC).
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

  const visibleColDefs = ALL_CONTRACT_COLUMNS.filter((c) => visibleColumns.includes(c.key));
  const totalWeight = visibleColDefs.reduce((s, c) => s + c.weight, 0);

  return (
    <div>
      {showFilter && (
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by supplier, department, or owner…"
            style={{ width: "280px" }}
          />
        </div>
      )}

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
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColDefs.length}
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    fontSize: "13px",
                    color: "rgba(0,0,0,0.35)",
                  }}
                >
                  No contracts match your filter.
                </td>
              </tr>
            ) : (
              sorted.map((contract) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
