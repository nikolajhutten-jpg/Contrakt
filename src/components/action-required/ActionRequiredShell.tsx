"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { confirmAction } from "@/lib/api/contracts";
import { getDisplayStatus } from "@/lib/utils/contractStatus";
import type { ContractSummary } from "@/types";

interface ActionRequiredShellProps {
  contracts: ContractSummary[];
  currentUserId: string;
  isAdmin: boolean;
  /** True for business owners and admins; dept owners can view but not confirm. */
  canConfirm: boolean;
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

interface ConfirmButtonProps {
  contractId: string;
  onConfirmed: (id: string) => void;
}

function ConfirmButton({ contractId, onConfirmed }: ConfirmButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await confirmAction(contractId);
        onConfirmed(contractId);
      } catch {
        setError("Failed to confirm. Please try again.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Confirming…" : "Confirm action"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export default function ActionRequiredShell({
  contracts: initialContracts,
  currentUserId,
  isAdmin,
  canConfirm,
}: ActionRequiredShellProps) {
  const router = useRouter();
  const [contracts, setContracts] = useState(initialContracts);

  function handleConfirmed(id: string) {
    setContracts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="px-8 py-6 max-w-screen-xl">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
        <h1 className="text-2xl font-semibold text-gray-900">Action required</h1>
        {contracts.length > 0 && (
          <span className="text-sm text-red-600 font-medium">
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          heading="No action required"
          subtext="Contracts needing attention will appear here."
          actionLabel="View all contracts"
          onAction={() => router.push("/contracts")}
        />
      ) : (
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  Supplier
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  Department
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  Owner
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  End date
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  Notice deadline
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  Status
                </th>
                {canConfirm && (
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((contract) => {
                const isOwner = contract.owners.some(
                  (o) => o.id === currentUserId,
                );
                // Admins can confirm any contract; business owners only their own
                const showConfirm = canConfirm && (isAdmin || isOwner);

                return (
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
                    <td className="px-4 py-3 text-gray-600">
                      {contract.department.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ownerNames(contract.owners)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(contract.endDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(contract.renewalNoticeDeadline)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={getDisplayStatus(contract)} />
                    </td>
                    {canConfirm && (
                      <td className="px-4 py-3">
                        {showConfirm ? (
                          <ConfirmButton
                            contractId={contract.id}
                            onConfirmed={handleConfirmed}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
