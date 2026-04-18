"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import { confirmAction } from "@/lib/api/contracts";
import { getDisplayStatus } from "@/lib/utils/contractStatus";
import type { ContractSummary } from "@/types";

interface ActionRequiredShellProps {
  contracts: ContractSummary[];
  currentUserId: string;
  isAdmin: boolean;
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

const TH_STYLE: React.CSSProperties = {
  padding: "0 16px",
  height: "36px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.4)",
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const TD_STYLE: React.CSSProperties = {
  padding: "0 16px",
  height: "40px",
  fontSize: "13px",
  color: "rgba(0,0,0,0.5)",
  borderBottom: "0.5px solid rgba(0,0,0,0.05)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

interface ConfirmButtonProps {
  contractId: string;
  onConfirmed: (id: string) => void;
}

function ConfirmButton({ contractId, onConfirmed }: ConfirmButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm(e: React.MouseEvent) {
    e.stopPropagation();
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
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <button
        onClick={handleConfirm}
        disabled={isPending}
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: isPending ? "rgba(0,0,0,0.3)" : "#1a7f4b",
          background: "transparent",
          border: `0.5px solid ${isPending ? "rgba(0,0,0,0.1)" : "rgba(26,127,75,0.3)"}`,
          borderRadius: "6px",
          padding: "4px 10px",
          cursor: isPending ? "default" : "pointer",
          transition: "background 0.15s, color 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          if (!isPending)
            (e.currentTarget as HTMLElement).style.background = "rgba(26,127,75,0.06)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        {isPending ? "Confirming…" : "Confirm"}
      </button>
      {error && (
        <span style={{ fontSize: "12px", color: "#c0392b" }}>{error}</span>
      )}
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
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  function handleConfirmed(id: string) {
    setFadingIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setContracts((prev) => prev.filter((c) => c.id !== id));
      setFadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1280px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "-0.03em", color: "#171717" }}>
          Action required
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "3px" }}>
          Contracts that need your attention
        </p>
      </div>

      {contracts.length === 0 ? (
        /* Inline empty state — no CTA needed here */
        <div
          style={{
            background: "#ffffff",
            border: "0.5px solid rgba(0,0,0,0.08)",
            borderRadius: "12px",
            padding: "48px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "#171717", marginBottom: "4px" }}>
            No action required
          </p>
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)" }}>
            All contracts are up to date
          </p>
        </div>
      ) : (
        <>
          {/* Row count */}
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginBottom: "10px" }}>
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""} require attention
          </p>

          {/* Table */}
          <div style={{ background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", overflow: "hidden" }}>
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "13%" }} />
                {canConfirm && <col style={{ width: "11%" }} />}
              </colgroup>
              <thead>
                <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                  <th style={TH_STYLE}>Supplier</th>
                  <th style={TH_STYLE}>Department</th>
                  <th style={TH_STYLE}>Owner</th>
                  <th style={TH_STYLE}>End date</th>
                  <th style={TH_STYLE}>Notice deadline</th>
                  <th style={TH_STYLE}>Status</th>
                  {canConfirm && <th style={TH_STYLE}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const isOwner = contract.owners.some((o) => o.id === currentUserId);
                  const showConfirm = canConfirm && (isAdmin || isOwner);
                  const fading = fadingIds.has(contract.id);

                  return (
                    <tr
                      key={contract.id}
                      style={{
                        opacity: fading ? 0 : 1,
                        transition: "opacity 200ms ease-out",
                        cursor: "pointer",
                      }}
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                      onMouseEnter={(e) => {
                        if (!fading)
                          (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <td style={{ ...TD_STYLE, color: "#171717", fontWeight: 500 }}>
                        {contract.vendor.name}
                      </td>
                      <td style={TD_STYLE}>{contract.department.name}</td>
                      <td style={TD_STYLE}>{ownerNames(contract.owners)}</td>
                      <td style={TD_STYLE}>{formatDate(contract.endDate)}</td>
                      <td style={TD_STYLE}>{formatDate(contract.renewalNoticeDeadline)}</td>
                      <td style={{ ...TD_STYLE, overflow: "visible" }}>
                        <StatusBadge status={getDisplayStatus(contract)} />
                      </td>
                      {canConfirm && (
                        <td style={TD_STYLE}>
                          {showConfirm ? (
                            <ConfirmButton contractId={contract.id} onConfirmed={handleConfirmed} />
                          ) : (
                            <span style={{ color: "rgba(0,0,0,0.25)" }}>—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
