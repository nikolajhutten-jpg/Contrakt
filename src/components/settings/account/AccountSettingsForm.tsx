"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAccountSettings } from "@/lib/api/settings";
import Spinner from "@/components/ui/Spinner";
import type { Tenant } from "@/types";

interface AccountSettingsFormProps {
  tenant: Tenant;
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#171717",
  marginBottom: "4px",
};

const SECTION_DESC: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(0,0,0,0.4)",
  marginBottom: "12px",
};

const FIELD_LABEL: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#171717",
  marginBottom: "4px",
  display: "block",
};

const SECTION_DIVIDER: React.CSSProperties = {
  borderBottom: "0.5px solid rgba(0,0,0,0.08)",
  paddingBottom: "24px",
  marginBottom: "24px",
};

export default function AccountSettingsForm({ tenant }: AccountSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(tenant.name);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateAccountSettings({
          name: name.trim() || undefined,
        });
        setSaved(true);
        router.refresh();
      } catch {
        setError("Failed to save settings. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSave} style={{ maxWidth: "480px" }}>
      {/* Company */}
      <div style={SECTION_DIVIDER}>
        <p style={SECTION_LABEL}>Company</p>
        <p style={SECTION_DESC}>Your organisation name as it appears in Contrakt.</p>
        <label style={FIELD_LABEL}>Company name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Slack UI hidden — backend intact */}

      {/* Tenant info */}
      <div style={{ marginBottom: "24px" }}>
        <p style={SECTION_LABEL}>Tenant</p>
        <p style={SECTION_DESC}>Read-only identifier for your workspace.</p>
        <label style={FIELD_LABEL}>Tenant slug</label>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)" }}>{tenant.slug}</p>
      </div>

      {error && <p style={{ fontSize: "12px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>}
      {saved && <p style={{ fontSize: "12px", color: "#1a7f4b", marginBottom: "12px" }}>Settings saved.</p>}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 16px",
            background: "rgba(0,0,0,0.05)",
            color: "#171717",
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: "8px",
            cursor: isPending ? "default" : "pointer",
            opacity: isPending ? 0.5 : 1,
            letterSpacing: "-0.01em",
          }}
        >
          {isPending && <Spinner />}
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
