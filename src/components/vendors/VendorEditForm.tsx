"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateVendor } from "@/lib/api/vendors";
import type { Vendor } from "@/types";

interface VendorEditFormProps {
  vendor: Vendor;
  onClose: () => void;
}

const FIELD_LABEL: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#171717",
  marginBottom: "4px",
};

export default function VendorEditForm({ vendor, onClose }: VendorEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(vendor.name);
  const [contactName, setContactName] = useState(vendor.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(vendor.contactEmail ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        await updateVendor(vendor.id, {
          name: name.trim(),
          contactName: contactName.trim() || null,
          contactEmail: contactEmail.trim() || null,
        });
        router.refresh();
        onClose();
      } catch {
        setError("Failed to save changes. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={FIELD_LABEL}>Vendor name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div>
        <label style={FIELD_LABEL}>Contact name</label>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div>
        <label style={FIELD_LABEL}>Contact email</label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="Optional"
        />
      </div>

      {error && <p style={{ fontSize: "12px", color: "#c0392b" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          style={{
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 16px",
            background: "#1a7f4b",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: (isPending || !name.trim()) ? "default" : "pointer",
            opacity: (isPending || !name.trim()) ? 0.5 : 1,
            letterSpacing: "-0.01em",
          }}
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          style={{
            fontSize: "13px",
            color: "rgba(0,0,0,0.4)",
            background: "none",
            border: "none",
            cursor: isPending ? "default" : "pointer",
            padding: 0,
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
