"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import type { VendorWithContractCount } from "@/types";

interface VendorListProps {
  vendors: VendorWithContractCount[];
  isAdmin: boolean;
}

export default function VendorList({ vendors, isAdmin }: VendorListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [vendors, query]);

  return (
    <div className="px-8 py-6 max-w-screen-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">Vendors</h1>
        {isAdmin && (
          <Link
            href="/vendors/new"
            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-700 transition-colors"
          >
            Add vendor
          </Link>
        )}
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          heading="No vendors yet"
          subtext="Vendors are created automatically when you upload a contract, or an admin can add them manually."
          actionLabel="Upload a contract"
          onAction={() => router.push("/contracts/new")}
        />
      ) : (
        <>
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendors…"
              className="w-full max-w-sm px-3 py-1.5 text-sm border border-gray-300 rounded bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          {/* Vendor table */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                    Vendor name
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                    Contracts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-sm text-gray-400"
                    >
                      No vendors match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="bg-white hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/vendors/${vendor.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {vendor.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {vendor.contractCount}{" "}
                        {vendor.contractCount === 1 ? "contract" : "contracts"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
