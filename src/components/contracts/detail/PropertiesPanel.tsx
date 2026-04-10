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
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
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
