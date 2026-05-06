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

const TH_STYLE: React.CSSProperties = {
  padding: "0 16px",
  height: "36px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.4)",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
};

const TD_STYLE: React.CSSProperties = {
  padding: "0 16px",
  height: "40px",
  fontSize: "13px",
  color: "rgba(0,0,0,0.5)",
  borderBottom: "0.5px solid rgba(0,0,0,0.05)",
};

export default function VendorList({ vendors, isAdmin }: VendorListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [vendors, query]);

  return (
    <div style={{ padding: "28px 32px", maxWidth: "960px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#171717", letterSpacing: "-0.03em" }}>Vendors</h1>
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
          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendors…"
              style={{ width: "280px" }}
            />
          </div>

          {/* Vendor table */}
          <div style={{ background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                  <th style={TH_STYLE}>Vendor name</th>
                  <th style={TH_STYLE}>Contracts</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      style={{ ...TD_STYLE, textAlign: "center", padding: "32px 16px" }}
                    >
                      No vendors match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((vendor) => (
                    <tr
                      key={vendor.id}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <td style={{ ...TD_STYLE, color: "#171717", fontWeight: 500 }}>
                        <Link
                          href={`/vendors/${vendor.id}`}
                          style={{ color: "#171717", textDecoration: "none" }}
                        >
                          {vendor.name}
                        </Link>
                      </td>
                      <td style={TD_STYLE}>
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
