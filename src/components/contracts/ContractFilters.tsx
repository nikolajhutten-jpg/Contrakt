"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { ContractStatus, TermType } from "@/types";
import type { Department } from "@/types";

interface ContractFiltersProps {
  departments: Department[];
}

export default function ContractFilters({ departments }: ContractFiltersProps) {
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

  return (
    <div className="flex flex-wrap items-end gap-3 mb-5">
      {/* Free-text search */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Search</label>
        <input
          type="text"
          defaultValue={get("search")}
          onChange={(e) => update("search", e.target.value)}
          placeholder="Supplier, department, or owner…"
          className="w-56 px-3 py-1.5 text-sm border border-gray-300 rounded bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Status</label>
        <select
          value={get("status")}
          onChange={(e) => update("status", e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value="">All statuses</option>
          <option value={ContractStatus.Active}>Active</option>
          <option value={ContractStatus.Expired}>Expired</option>
          <option value={ContractStatus.AutoRenewed}>Auto-renewed</option>
          <option value={ContractStatus.ActionRequired}>Action required</option>
        </select>
      </div>

      {/* Department */}
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

      {/* Term type */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Term type</label>
        <select
          value={get("termType")}
          onChange={(e) => update("termType", e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value="">All terms</option>
          <option value={TermType.Fixed}>Fixed</option>
          <option value={TermType.Indefinite}>Indefinite</option>
        </select>
      </div>

      {/* Auto-renewal */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Auto-renewal</label>
        <select
          value={get("autoRenewal")}
          onChange={(e) => update("autoRenewal", e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value="">Any</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      {/* End date range */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">End date from</label>
        <input
          type="date"
          value={get("endDateFrom")}
          onChange={(e) => update("endDateFrom", e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">End date to</label>
        <input
          type="date"
          value={get("endDateTo")}
          onChange={(e) => update("endDateTo", e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {/* Clear all */}
      {searchParams.size > 0 && (
        <button
          onClick={() => router.push(pathname)}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded bg-white transition-colors self-end"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
