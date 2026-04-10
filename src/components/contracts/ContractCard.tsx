"use client";

import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import type { ContractSummary } from "@/types";
import type { StatusVariant } from "@/components/ui/StatusBadge";

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

interface ContractCardProps {
  contract: ContractSummary;
}

export default function ContractCard({ contract }: ContractCardProps) {
  return (
    <Link
      href={`/contracts/${contract.id}`}
      className="block bg-white border border-gray-200 rounded p-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {contract.vendor.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {contract.internalGroupEntity}
          </p>
        </div>
        <StatusBadge status={contract.status as StatusVariant} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <dt className="text-gray-400">Department</dt>
          <dd className="text-gray-700 truncate">{contract.department.name}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Owner</dt>
          <dd className="text-gray-700 truncate">{ownerNames(contract.owners)}</dd>
        </div>
        <div>
          <dt className="text-gray-400">End date</dt>
          <dd className="text-gray-700">{formatDate(contract.endDate)}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Notice deadline</dt>
          <dd className="text-gray-700">
            {formatDate(contract.renewalNoticeDeadline)}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
