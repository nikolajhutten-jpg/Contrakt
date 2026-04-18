"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import ContractCard from "@/components/contracts/ContractCard";
import { getDisplayStatus } from "@/lib/utils/contractStatus";
import type { ContractSummary } from "@/types";

const VIEW_KEY = "contrakt_contracts_view";

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ownerNames(owners: { name: string }[]): string {
  if (owners.length === 0) return "—";
  if (owners.length === 1) return owners[0].name;
  return `${owners[0].name} +${owners.length - 1}`;
}

interface ContractTableFullProps {
  contracts: ContractSummary[];
}

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

export default function ContractTableFull({ contracts }: ContractTableFullProps) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "card">("table");

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_KEY);
    if (stored === "card" || stored === "table") setView(stored);
  }, []);

  function switchView(next: "table" | "card") {
    localStorage.setItem(VIEW_KEY, next);
    setView(next);
  }

  return (
    <div>
      {/* Toolbar: row count left, view toggle right */}
      <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)" }}>
          {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
        </p>
        {/* Segmented control */}
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

      {view === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "12px" }}>
          {contracts.map((c) => (
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
              <col style={{ width: "22%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                <th style={TH_STYLE}>Supplier</th>
                <th style={TH_STYLE}>Department</th>
                <th style={TH_STYLE}>Owner</th>
                <th style={TH_STYLE}>End date</th>
                <th style={TH_STYLE}>Notice deadline</th>
                <th style={TH_STYLE}>Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                contracts.map((contract) => (
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
                    <td style={{ ...TD_STYLE, color: "#171717", fontWeight: 500 }}>
                      {contract.vendor.name}
                    </td>
                    <td style={TD_STYLE}>{contract.department.name}</td>
                    <td style={TD_STYLE}>{ownerNames(contract.owners)}</td>
                    <td style={TD_STYLE}>{formatDate(contract.endDate)}</td>
                    <td style={TD_STYLE}>{formatDate(contract.renewalNoticeDeadline)}</td>
                    <td style={{ ...TD_STYLE, overflow: "visible" }}>
                      <StatusBadge status={getDisplayStatus(contract)} />
                    </td>
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
