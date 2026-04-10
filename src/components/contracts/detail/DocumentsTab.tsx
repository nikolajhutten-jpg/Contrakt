"use client";

import { DocumentType } from "@/types";
import type { Document } from "@/types";

interface DocumentsTabProps {
  documents: Document[];
  onSelect: (doc: Document) => void;
  selectedId: string | null;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TYPE_LABELS: Record<string, string> = {
  main: "Main",
  attachment: "Attachment",
  addendum: "Addendum",
  amendment: "Amendment",
  renewal: "Renewal",
};

function DocRow({
  doc,
  selected,
  onSelect,
  label,
}: {
  doc: Document;
  selected: boolean;
  onSelect: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
        selected
          ? "bg-gray-900 text-white"
          : "hover:bg-gray-50 text-gray-700"
      }`}
    >
      <svg
        className={`w-4 h-4 flex-shrink-0 ${selected ? "text-white" : "text-gray-400"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{label ?? doc.fileName}</p>
        <p className={`text-xs mt-0.5 ${selected ? "text-gray-300" : "text-gray-400"}`}>
          {doc.fileFormat.toUpperCase()} · {formatDate(doc.uploadedAt)}
        </p>
      </div>
    </button>
  );
}

export default function DocumentsTab({
  documents,
  onSelect,
  selectedId,
}: DocumentsTabProps) {
  const nonRenewal = documents.filter((d) => d.type !== DocumentType.Renewal);
  const renewals = documents
    .filter((d) => d.type === DocumentType.Renewal)
    .sort((a, b) => b.version - a.version);

  const grouped: Record<string, Document[]> = {};
  for (const doc of nonRenewal) {
    if (!grouped[doc.type]) grouped[doc.type] = [];
    grouped[doc.type].push(doc);
  }

  const sectionOrder = [
    DocumentType.Main,
    DocumentType.Attachment,
    DocumentType.Addendum,
    DocumentType.Amendment,
  ];

  if (documents.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">No documents attached yet.</p>
    );
  }

  return (
    <div className="space-y-5">
      {sectionOrder.map((type) => {
        const docs = grouped[type];
        if (!docs || docs.length === 0) return null;
        return (
          <section key={type}>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
              {TYPE_LABELS[type]}s
            </h3>
            <div className="space-y-0.5">
              {docs.map((doc) => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  selected={doc.id === selectedId}
                  onSelect={() => onSelect(doc)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {renewals.length > 0 && (
        <section>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Renewal history
          </h3>
          <div className="space-y-0.5">
            {renewals.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                selected={doc.id === selectedId}
                onSelect={() => onSelect(doc)}
                label={`Version ${doc.version} — ${doc.fileName}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
