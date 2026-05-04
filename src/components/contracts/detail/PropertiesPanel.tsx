"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import PropertiesTab from "@/components/contracts/detail/PropertiesTab";
import DocumentsTab from "@/components/contracts/detail/DocumentsTab";
import AlertsTab from "@/components/contracts/detail/AlertsTab";
import { useToast } from "@/lib/hooks/useToast";
import type { ContractWithRelations, Document } from "@/types";

type Tab = "properties" | "documents" | "alerts";

interface PropertiesPanelProps {
  contract: ContractWithRelations;
  canEdit: boolean;
  selectedDoc: Document | null;
  onSelectDoc: (doc: Document) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "properties", label: "Properties" },
  { id: "documents", label: "Documents" },
  { id: "alerts", label: "Alerts" },
];

export default function PropertiesPanel({
  contract,
  canEdit,
  selectedDoc,
  onSelectDoc,
}: PropertiesPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("properties");
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startDelete(async () => {
      const res = await fetch(`/api/contracts/${contract.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(body?.error ?? "Failed to delete contract. Please try again.", "error");
        setConfirming(false);
        return;
      }
      window.location.href = "/contracts";
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div
        className="flex flex-shrink-0"
        style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setConfirming(false); }}
            style={{
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: 500,
              border: "none",
              borderBottom: activeTab === tab.id
                ? "2px solid #1a7f4b"
                : "2px solid transparent",
              color: activeTab === tab.id ? "#1a7f4b" : "rgba(0,0,0,0.4)",
              background: "transparent",
              cursor: "pointer",
              transition: "color 0.15s",
              marginBottom: "-0.5px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "20px 24px" }}
      >
        {activeTab === "properties" && (
          <PropertiesTab contract={contract} canEdit={canEdit} />
        )}
        {activeTab === "documents" && (
          <DocumentsTab
            documents={contract.documents}
            onSelect={onSelectDoc}
            selectedId={selectedDoc?.id ?? null}
          />
        )}
        {activeTab === "alerts" && (
          <AlertsTab
            alerts={contract.notificationAlerts}
            contractId={contract.id}
            canEdit={canEdit}
          />
        )}

        {/* Delete button — properties tab only, admins only */}
        {activeTab === "properties" && canEdit && (
          <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
            {confirming ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    fontWeight: 500,
                    padding: "8px 0",
                    background: "#c0392b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: deleting ? "not-allowed" : "pointer",
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? "Deleting…" : "Yes, delete contract"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    padding: "8px 14px",
                    background: "transparent",
                    color: "rgba(0,0,0,0.5)",
                    border: "0.5px solid rgba(0,0,0,0.15)",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleDeleteClick}
                style={{
                  width: "100%",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "8px 0",
                  background: "transparent",
                  color: "rgba(0,0,0,0.35)",
                  border: "0.5px solid rgba(0,0,0,0.12)",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.color = "#c0392b";
                  el.style.borderColor = "rgba(192,57,43,0.3)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.color = "rgba(0,0,0,0.35)";
                  el.style.borderColor = "rgba(0,0,0,0.12)";
                }}
              >
                Delete contract
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
