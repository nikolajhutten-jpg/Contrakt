"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { getDisplayStatus } from "@/lib/utils/contractStatus";
import type { ContractSummary } from "@/types";

interface ContractTableProps {
  contracts: ContractSummary[];
  showFilter?: boolean;
}

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

export default function ContractTable({
  contracts,
  showFilter = true,
}: ContractTableProps) {
  const [query, setQuery] = useState("");

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

  return (
    <div>
      {/* Filter */}
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

      {/* Table */}
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
            <col style={{ width: "20%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
              <th style={TH_STYLE}>Supplier</th>
              <th style={TH_STYLE}>Department</th>
              <th style={TH_STYLE}>Owner</th>
              <th style={TH_STYLE}>Start date</th>
              <th style={TH_STYLE}>End date</th>
              <th style={TH_STYLE}>Notice deadline</th>
              <th style={TH_STYLE}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
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
              filtered.map((contract) => (
                <tr
                  key={contract.id}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <td style={{ ...TD_STYLE, color: "#171717", fontWeight: 500 }}>
                    <Link
                      href={`/contracts/${contract.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {contract.vendor.name}
                    </Link>
                  </td>
                  <td style={TD_STYLE}>{contract.department.name}</td>
                  <td style={TD_STYLE}>{ownerNames(contract.owners)}</td>
                  <td style={TD_STYLE}>{formatDate(contract.startDate)}</td>
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
    </div>
  );
}
