"use client";

import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { getDisplayStatus } from "@/lib/utils/contractStatus";
import type { ContractSummary } from "@/types";

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
      style={{
        display: "block",
        background: "#ffffff",
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: "12px",
        padding: "14px 16px",
        textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.14)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between" style={{ gap: "12px", marginBottom: "12px" }}>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#171717",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {contract.vendor.name}
          </p>
          {contract.groupEntity && (
            <p
              style={{
                fontSize: "11px",
                color: "rgba(0,0,0,0.4)",
                marginTop: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {contract.groupEntity.name}
            </p>
          )}
        </div>
        <StatusBadge status={getDisplayStatus(contract)} />
      </div>

      {/* Metadata grid */}
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: "16px",
          rowGap: "8px",
        }}
      >
        <div>
          <dt style={{ fontSize: "11px", color: "rgba(0,0,0,0.35)" }}>Department</dt>
          <dd
            style={{
              fontSize: "12px",
              color: "#171717",
              marginTop: "1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {contract.department.name}
          </dd>
        </div>
        <div>
          <dt style={{ fontSize: "11px", color: "rgba(0,0,0,0.35)" }}>Owner</dt>
          <dd
            style={{
              fontSize: "12px",
              color: "#171717",
              marginTop: "1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {ownerNames(contract.owners)}
          </dd>
        </div>
        <div>
          <dt style={{ fontSize: "11px", color: "rgba(0,0,0,0.35)" }}>End date</dt>
          <dd style={{ fontSize: "12px", color: "#171717", marginTop: "1px" }}>
            {formatDate(contract.endDate)}
          </dd>
        </div>
        <div>
          <dt style={{ fontSize: "11px", color: "rgba(0,0,0,0.35)" }}>Notice deadline</dt>
          <dd style={{ fontSize: "12px", color: "#171717", marginTop: "1px" }}>
            {formatDate(contract.renewalNoticeDeadline)}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
