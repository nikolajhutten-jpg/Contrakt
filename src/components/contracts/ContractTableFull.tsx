"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import ContractCard from "@/components/contracts/ContractCard";
import { getDisplayStatus } from "@/lib/utils/contractStatus";
import { useTablePreferences, ALL_CONTRACT_COLUMNS } from "@/lib/hooks/useTablePreferences";
import type { ContractSummary } from "@/types";

const VIEW_KEY = "contrakt_contracts_view";

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

interface ContractTableFullProps {
  contracts: ContractSummary[];
}

export default function ContractTableFull({ contracts }: ContractTableFullProps) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "card">("table");

  const { visibleColumns, sortColumn, sortDirection, setSort } =
    useTablePreferences("contracts_full");

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_KEY);
    if (stored === "card" || stored === "table") setView(stored);
  }, []);

  function switchView(next: "table" | "card") {
    localStorage.setItem(VIEW_KEY, next);
    setView(next);
  }

  // When sortColumn is null, preserve the server's default order
  // (renewalNoticeDeadline ASC nulls last, endDate ASC).
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
    <div>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "12px" }}
      >
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)" }}>
          {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
        </p>

        {/* View segmented control */}
        <div
          style={{
            display: "flex",
            background: "rgba(0,0,0,0.05)",
            borderRadius: "8px",
            padding: "3px",
            gap: "2px",
          }}
        >
          {(["table", "card"] as const).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              aria-label={`${v === "table" ? "Table" : "Card"} view`}
              style={{
                fontSize: "12px",
                fontWeight: 500,
                padding: "3px 10px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
                background: view === v ? "#ffffff" : "transparent",
                color: view === v ? "#171717" : "rgba(0,0,0,0.4)",
                boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {v === "table" ? "Table" : "Cards"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "12px" }}>
          {sorted.map((c) => (
            <ContractCard key={c.id} contract={c} />
          ))}
        </div>
      ) : (
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
                    No contracts found.
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
      )}
    </div>
  );
}
