"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import ContractFilters from "@/components/contracts/ContractFilters";
import ContractTableFull from "@/components/contracts/ContractTableFull";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
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
    <div style={{ padding: "28px 32px", maxWidth: "1280px" }}>
      {/* Page header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: "#171717",
          }}
        >
          Contracts
        </h1>
        <Button variant="secondary" size="sm" onClick={() => router.push("/contracts/new")}>
          Add contract
        </Button>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <ContractFilters departments={departments} />
      </Suspense>

      {/* Table or empty state */}
      <div style={{ marginTop: "16px" }}>
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
    </div>
  );
}
