"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import ContractCard from "@/components/contracts/ContractCard";
import type { ContractSummary } from "@/types";
import type { StatusVariant } from "@/components/ui/StatusBadge";

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

export default function ContractTableFull({ contracts }: ContractTableFullProps) {
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
      {/* View toggle */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1 border border-gray-200 rounded p-0.5 bg-white">
          <button
            onClick={() => switchView("table")}
            aria-label="Table view"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              view === "table"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => switchView("card")}
            aria-label="Card view"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              view === "card"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      {view === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((c) => (
            <ContractCard key={c.id} contract={c} />
          ))}
        </div>
      ) : (
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Supplier</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Department</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Owner</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">End date</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Notice deadline</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No contracts found.
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract.id} className="bg-white hover:bg-gray-50 transition-colors">
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
                    <td className="px-4 py-3 text-gray-600">{formatDate(contract.endDate)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(contract.renewalNoticeDeadline)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={contract.status as StatusVariant} />
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
