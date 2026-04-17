"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { ContractStatus, TermType } from "@/types";
import type { Department } from "@/types";

interface ContractFiltersProps {
  departments: Department[];
}

const SELECT_STYLE: React.CSSProperties = { height: "34px" };

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
  const hasFilters = searchParams.size > 0;

  return (
    <div
      className="flex items-center flex-wrap"
      style={{ gap: "8px" }}
    >
      {/* Search */}
      <input
        type="text"
        defaultValue={get("search")}
        onChange={(e) => update("search", e.target.value)}
        placeholder="Search contracts…"
        style={{ width: "280px" }}
      />

      {/* Status */}
      <select
        value={get("status")}
        onChange={(e) => update("status", e.target.value)}
        style={SELECT_STYLE}
      >
        <option value="">All statuses</option>
        <option value={ContractStatus.Active}>Active</option>
        <option value={ContractStatus.Expired}>Expired</option>
        <option value={ContractStatus.AutoRenewed}>Auto-renewed</option>
        <option value={ContractStatus.ActionRequired}>Action required</option>
      </select>

      {/* Department */}
      <select
        value={get("departmentId")}
        onChange={(e) => update("departmentId", e.target.value)}
        style={SELECT_STYLE}
      >
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      {/* Term type */}
      <select
        value={get("termType")}
        onChange={(e) => update("termType", e.target.value)}
        style={SELECT_STYLE}
      >
        <option value="">All terms</option>
        <option value={TermType.Fixed}>Fixed</option>
        <option value={TermType.Indefinite}>Indefinite</option>
      </select>

      {/* Auto-renewal */}
      <select
        value={get("autoRenewal")}
        onChange={(e) => update("autoRenewal", e.target.value)}
        style={SELECT_STYLE}
      >
        <option value="">Any auto-renewal</option>
        <option value="true">Auto-renewal on</option>
        <option value="false">Auto-renewal off</option>
      </select>

      {/* End date range */}
      <input
        type="date"
        value={get("endDateFrom")}
        onChange={(e) => update("endDateFrom", e.target.value)}
        style={{ height: "34px" }}
      />
      <input
        type="date"
        value={get("endDateTo")}
        onChange={(e) => update("endDateTo", e.target.value)}
        style={{ height: "34px" }}
      />

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          style={{
            fontSize: "12px",
            color: "rgba(0,0,0,0.4)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 4px",
            marginLeft: "4px",
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
