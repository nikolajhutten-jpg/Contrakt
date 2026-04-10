"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import ContractTable from "@/components/dashboard/ContractTable";
import EmptyState from "@/components/ui/EmptyState";
import type { ContractSummary, Department } from "@/types";
import type { RenewalsFilterParams } from "@/lib/db/renewals";

interface RenewalsShellProps {
  contracts: ContractSummary[];
  departments: Department[];
  activeFilters: RenewalsFilterParams;
}

export default function RenewalsShell({
  contracts,
  departments,
  activeFilters,
}: RenewalsShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const get = (key: string) => searchParams.get(key) ?? "";
  const hasFilters = searchParams.size > 0;

  return (
    <div className="px-8 py-6 max-w-screen-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
          <h1 className="text-xl font-medium text-gray-900">Renewals</h1>
          {contracts.length > 0 && (
            <span className="text-sm text-amber-600 font-medium">
              {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Department</label>
          <select
            value={get("departmentId")}
            onChange={(e) => update("departmentId", e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Notice deadline from
          </label>
          <input
            type="date"
            value={get("deadlineFrom")}
            onChange={(e) => update("deadlineFrom", e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Notice deadline to
          </label>
          <input
            type="date"
            value={get("deadlineTo")}
            onChange={(e) => update("deadlineTo", e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded bg-white transition-colors self-end"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Contract list */}
      {contracts.length === 0 ? (
        <EmptyState
          heading="No upcoming renewals"
          subtext={
            hasFilters
              ? "No contracts match your current filters."
              : "Contracts with approaching renewal notice deadlines will appear here."
          }
          actionLabel="View all contracts"
          onAction={() => router.push("/contracts")}
        />
      ) : (
        <ContractTable contracts={contracts} forceRenewalDueBadge />
      )}
    </div>
  );
}
