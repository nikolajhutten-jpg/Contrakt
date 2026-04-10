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
        <div className="mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by supplier, department, or owner…"
            className="w-full max-w-sm px-3 py-1.5 text-sm border border-gray-300 rounded bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded overflow-hidden">
        <table className="w-full text-sm table-fixed">
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
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Supplier</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Department</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Owner</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Start date</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">End date</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Notice deadline</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  No contracts match your filter.
                </td>
              </tr>
            ) : (
              filtered.map((contract) => (
                <tr
                  key={contract.id}
                  className="bg-white hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {contract.vendor.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{contract.department.name}</td>
                  <td className="px-4 py-3 text-gray-600">{ownerNames(contract.owners)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(contract.startDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(contract.endDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(contract.renewalNoticeDeadline)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
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
