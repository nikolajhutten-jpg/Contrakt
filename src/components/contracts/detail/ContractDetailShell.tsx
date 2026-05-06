"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DocumentViewer from "@/components/contracts/detail/DocumentViewer";
import PropertiesPanel from "@/components/contracts/detail/PropertiesPanel";
import type { ContractWithRelations, Document } from "@/types";
import { DocumentType } from "@/types";

interface ContractDetailShellProps {
  contract: ContractWithRelations;
  canEdit: boolean;
  currentUserId: string;
}

export default function ContractDetailShell({
  contract,
  canEdit,
}: ContractDetailShellProps) {
  const router = useRouter();

  const mainDoc =
    contract.documents.find((d) => d.type === DocumentType.Main) ?? null;

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(mainDoc);

  return (
    <div className="flex h-full">
      {/* Left pane — document viewer */}
      <div
        className="flex flex-col flex-1 min-w-0"
        style={{ borderRight: "0.5px solid rgba(0,0,0,0.08)", background: "#f5f5f7" }}
      >
        {/* Viewer header */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{
            padding: "0 16px",
            height: "44px",
            background: "#ffffff",
            borderBottom: "0.5px solid rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center min-w-0" style={{ gap: "10px" }}>
            <button
              onClick={() => router.back()}
              style={{
                fontSize: "13px",
                color: "rgba(0,0,0,0.4)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#1a1a1a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)";
              }}
            >
              ← Contracts
            </button>
            <span style={{ color: "rgba(0,0,0,0.2)", flexShrink: 0 }}>·</span>
            <h1
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#171717",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={contract.vendor.name}
            >
              {contract.vendor.name}
            </h1>
          </div>
          {selectedDoc && (
            <span
              style={{
                fontSize: "12px",
                color: "rgba(0,0,0,0.35)",
                flexShrink: 0,
                marginLeft: "8px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "200px",
              }}
            >
              {selectedDoc.fileName}
            </span>
          )}
        </div>

        {/* Viewer body */}
        <div className="flex-1 min-h-0">
          <DocumentViewer document={selectedDoc} />
        </div>
      </div>

      {/* Right pane — properties panel */}
      <div
        className="flex-shrink-0 flex flex-col"
        style={{ width: "380px", background: "#ffffff" }}
      >
        <PropertiesPanel
          contract={contract}
          canEdit={canEdit}
          selectedDoc={selectedDoc}
          onSelectDoc={setSelectedDoc}
        />
      </div>
    </div>
  );
}
