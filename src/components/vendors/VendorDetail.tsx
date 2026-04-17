"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import VendorEditForm from "@/components/vendors/VendorEditForm";
import { getDisplayStatus } from "@/lib/utils/contractStatus";
import { ContractStatus } from "@/types";
import type { VendorWithContracts, VendorContractRow } from "@/lib/db/vendors";

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

export default function VendorDetail({ vendor, isAdmin }: VendorDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(
    () => (!statusFilter ? vendor.contracts : vendor.contracts.filter((c) => c.status === statusFilter)),
    [vendor.contracts, statusFilter],
  );

  return (
    <div style={{ padding: "28px 32px", maxWidth: "960px" }}>
      {/* Vendor header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <nav style={{ fontSize: "12px", color: "rgba(0,0,0,0.35)" }}>
            <Link href="/vendors" style={{ color: "rgba(0,0,0,0.4)", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#1a7f4b"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"; }}
            >
              Vendors
            </Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ color: "#171717" }}>{vendor.name}</span>
          </nav>
          {isAdmin && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: "12px",
                color: "rgba(0,0,0,0.4)",
                background: "none",
                border: "0.5px solid rgba(0,0,0,0.12)",
                borderRadius: "8px",
                padding: "4px 10px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#171717"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"; }}
            >
              Edit vendor
            </button>
          )}
        </div>

        {isEditing ? (
          <div style={{ background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", padding: "20px", maxWidth: "384px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#171717", letterSpacing: "-0.01em", marginBottom: "16px" }}>Edit vendor</h2>
            <VendorEditForm vendor={vendor} onClose={() => setIsEditing(false)} />
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#171717", letterSpacing: "-0.03em", marginBottom: "12px" }}>{vendor.name}</h1>
            <dl style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
              <div>
                <dt style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>Contact name</dt>
                <dd style={{ color: "#171717" }}>{vendor.contactName || "—"}</dd>
              </div>
              <div>
                <dt style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>Contact email</dt>
                <dd style={{ color: "#171717" }}>
                  {vendor.contactEmail
                    ? <a href={`mailto:${vendor.contactEmail}`} style={{ color: "#1a7f4b", textDecoration: "none" }}>{vendor.contactEmail}</a>
                    : "—"}
                </dd>
              </div>
              <div>
                <dt style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>Contracts</dt>
                <dd style={{ color: "#171717" }}>{vendor.contracts.length}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Contract list */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#171717", letterSpacing: "-0.02em" }}>Contracts</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: "32px", fontSize: "13px" }}
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
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.35)", padding: "32px 0", textAlign: "center" }}>No contracts match the selected status.</p>
        ) : (
          <div style={{ background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                  <th style={TH_STYLE}>Group entity</th>
                  <th style={TH_STYLE}>Department</th>
                  <th style={TH_STYLE}>Owner</th>
                  <th style={TH_STYLE}>End date</th>
                  <th style={TH_STYLE}>Notice deadline</th>
                  <th style={TH_STYLE}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contract) => (
                  <tr
                    key={contract.id}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <td style={{ ...TD_STYLE, color: "#171717", fontWeight: 500 }}>
                      <Link href={`/contracts/${contract.id}`} style={{ color: "#171717", textDecoration: "none" }}>
                        {contract.groupEntity?.name || "—"}
                      </Link>
                    </td>
                    <td style={TD_STYLE}>{contract.department.name}</td>
                    <td style={TD_STYLE}>{owners(contract.owners)}</td>
                    <td style={TD_STYLE}>{fmt(contract.endDate)}</td>
                    <td style={TD_STYLE}>{fmt(contract.renewalNoticeDeadline)}</td>
                    <td style={{ ...TD_STYLE, paddingTop: "0", paddingBottom: "0" }}>
                      <StatusBadge status={getDisplayStatus({ ...contract, status: contract.status as ContractStatus })} />
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
