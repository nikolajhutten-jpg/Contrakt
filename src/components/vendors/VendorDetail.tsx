"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import VendorEditForm from "@/components/vendors/VendorEditForm";
import { ContractStatus } from "@/types";
import type { VendorWithContracts, VendorContractRow } from "@/lib/db/vendors";
import type { StatusVariant } from "@/components/ui/StatusBadge";

interface VendorDetailProps {
  vendor: VendorWithContracts;
  isAdmin: boolean;
}

const fmt = (d: Date | string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const owners = (os: VendorContractRow["owners"]) =>
  os.length === 0 ? "—" : os.length === 1 ? os[0].user.name : `${os[0].user.name} +${os.length - 1}`;

export default function VendorDetail({ vendor, isAdmin }: VendorDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(
    () => (!statusFilter ? vendor.contracts : vendor.contracts.filter((c) => c.status === statusFilter)),
    [vendor.contracts, statusFilter],
  );

  return (
    <div className="px-8 py-6 max-w-screen-xl">
      {/* Vendor header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <nav className="text-xs text-gray-400">
            <Link href="/vendors" className="hover:text-gray-600">Vendors</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-700">{vendor.name}</span>
          </nav>
          {isAdmin && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2.5 py-1 transition-colors"
            >
              Edit vendor
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="bg-white border border-gray-200 rounded p-5 max-w-sm">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Edit vendor</h2>
            <VendorEditForm vendor={vendor} onClose={() => setIsEditing(false)} />
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-medium text-gray-900 mb-3">{vendor.name}</h1>
            <dl className="flex gap-6 text-sm">
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Contact name</dt>
                <dd className="text-gray-700">{vendor.contactName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Contact email</dt>
                <dd className="text-gray-700">
                  {vendor.contactEmail
                    ? <a href={`mailto:${vendor.contactEmail}`} className="hover:underline">{vendor.contactEmail}</a>
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Contracts</dt>
                <dd className="text-gray-700">{vendor.contracts.length}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Contract list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-900">Contracts</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            <option value="">All statuses</option>
            <option value={ContractStatus.Active}>Active</option>
            <option value={ContractStatus.Expired}>Expired</option>
            <option value={ContractStatus.AutoRenewed}>Auto-renewed</option>
            <option value={ContractStatus.ActionRequired}>Action required</option>
          </select>
        </div>

        {vendor.contracts.length === 0 ? (
          <EmptyState
            heading="No contracts"
            subtext="No contracts are linked to this vendor yet."
            actionLabel="Upload a contract"
            onAction={() => window.location.assign("/contracts/new")}
          />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No contracts match the selected status.</p>
        ) : (
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Internal entity</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Department</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Owner</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">End date</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Notice deadline</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((contract) => (
                  <tr key={contract.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/contracts/${contract.id}`} className="font-medium text-gray-900 hover:underline">
                        {contract.internalGroupEntity || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{contract.department.name}</td>
                    <td className="px-4 py-3 text-gray-600">{owners(contract.owners)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(contract.endDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(contract.renewalNoticeDeadline)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={contract.status as StatusVariant} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
