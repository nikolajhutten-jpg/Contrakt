"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import ContractFilters from "@/components/contracts/ContractFilters";
import ContractTableFull from "@/components/contracts/ContractTableFull";
import EmptyState from "@/components/ui/EmptyState";
import type { ContractSummary, Department } from "@/types";
import type { ContractFilterParams } from "@/lib/db/contractsFiltered";

interface ContractsShellProps {
  contracts: ContractSummary[];
  departments: Department[];
  activeFilters: ContractFilterParams;
}

export default function ContractsShell({
  contracts,
  departments,
  activeFilters,
}: ContractsShellProps) {
  const router = useRouter();
  const hasFilters = Object.values(activeFilters).some(
    (v) => v !== undefined && v !== "",
  );

  return (
    <div className="px-8 py-6 max-w-screen-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">All Contracts</h1>
        <button
          onClick={() => router.push("/contracts/new")}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
        >
          Upload contract
        </button>
      </div>

      <Suspense fallback={null}>
        <ContractFilters departments={departments} />
      </Suspense>

      {contracts.length === 0 ? (
        <EmptyState
          heading={hasFilters ? "No contracts match your filters" : "No contracts yet"}
          subtext={
            hasFilters
              ? "Try adjusting or clearing your filters."
              : "Upload your first contract to get started."
          }
          actionLabel={hasFilters ? "Clear filters" : "Upload a contract"}
          onAction={() =>
            router.push(hasFilters ? "/contracts" : "/contracts/new")
          }
        />
      ) : (
        <ContractTableFull contracts={contracts} />
      )}
    </div>
  );
}
