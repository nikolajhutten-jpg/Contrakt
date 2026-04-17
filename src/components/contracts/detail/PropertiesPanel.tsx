"use client";

import { useState } from "react";
import PropertiesTab from "@/components/contracts/detail/PropertiesTab";
import DocumentsTab from "@/components/contracts/detail/DocumentsTab";
import AlertsTab from "@/components/contracts/detail/AlertsTab";
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
  const [activeTab, setActiveTab] = useState<Tab>("properties");

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
            onClick={() => setActiveTab(tab.id)}
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
      </div>
    </div>
  );
}
