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

  // Default to the main document if one exists
  const mainDoc =
    contract.documents.find((d) => d.type === DocumentType.Main) ?? null;

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(mainDoc);

  return (
    <div className="flex h-full">
      {/* Left pane — document viewer */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 bg-gray-50">
        {/* Viewer header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => router.back()}
              className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              ← Back
            </button>
            <span className="text-gray-300 flex-shrink-0">·</span>
            <h1
              className="text-sm font-medium text-gray-900 truncate"
              title={contract.vendor.name}
            >
              {contract.vendor.name}
            </h1>
          </div>
          {selectedDoc && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2 truncate max-w-48">
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
      <div className="w-96 flex-shrink-0 flex flex-col bg-white">
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
