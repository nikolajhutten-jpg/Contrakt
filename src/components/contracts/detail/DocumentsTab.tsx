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

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "20px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: 500,
        background: "rgba(0,0,0,0.06)",
        color: "rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 500,
        color: "rgba(0,0,0,0.35)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: "6px",
      }}
    >
      {children}
    </div>
  );
}

function DocRow({
  doc,
  selected,
  onSelect,
  label,
  indent = false,
}: {
  doc: Document;
  selected: boolean;
  onSelect: () => void;
  label?: string;
  indent?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 8px 8px",
        paddingLeft: indent ? "16px" : "8px",
        borderRadius: "8px",
        borderLeft: indent ? "2px solid rgba(0,0,0,0.1)" : "none",
        background: selected ? "rgba(0,0,0,0.04)" : "transparent",
        cursor: "pointer",
        border: "none",
        width: "100%",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)";
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {/* Filename */}
      <span
        style={{
          flex: 1,
          fontSize: "13px",
          fontWeight: 500,
          color: selected ? "#1a1a1a" : "#171717",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {label ?? doc.fileName}
      </span>
      {/* Type badge */}
      <TypeBadge type={doc.type} />
      {/* Date */}
      <span
        style={{
          fontSize: "12px",
          color: "rgba(0,0,0,0.4)",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {formatDate(doc.uploadedAt)}
      </span>
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
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", padding: "16px 0" }}>
        No documents attached yet.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {sectionOrder.map((type) => {
        const docs = grouped[type];
        if (!docs || docs.length === 0) return null;
        return (
          <section key={type}>
            <SectionLabel>{`${TYPE_LABELS[type]}s`}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
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
          <SectionLabel>Renewal history</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {renewals.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                selected={doc.id === selectedId}
                onSelect={() => onSelect(doc)}
                label={`v${doc.version} — ${doc.fileName}`}
                indent
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
