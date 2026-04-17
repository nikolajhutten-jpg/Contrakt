"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfile } from "@/lib/api/users";
import type { User } from "@/types";

interface ProfileFormProps {
  user: User;
}

const SECTION_DIVIDER: React.CSSProperties = {
  borderBottom: "0.5px solid rgba(0,0,0,0.08)",
  paddingBottom: "24px",
  marginBottom: "24px",
};

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

const FIELD_HINT: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(0,0,0,0.4)",
  marginTop: "5px",
};

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [slackUserId, setSlackUserId] = useState(user.slackUserId ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateMyProfile({
          name: name.trim(),
          email: email.trim(),
          slackUserId: slackUserId.trim() || null,
        });
        setSaved(true);
        router.refresh();
      } catch {
        setError("Failed to save profile. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "480px" }}>
      {/* Identity */}
      <div style={SECTION_DIVIDER}>
        <p style={SECTION_LABEL}>Identity</p>
        <p style={SECTION_DESC}>Your name and email as shown to teammates.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={FIELD_LABEL}>Display name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label style={FIELD_LABEL}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Slack */}
      <div style={SECTION_DIVIDER}>
        <p style={SECTION_LABEL}>Slack</p>
        <p style={SECTION_DESC}>Connect your Slack identity for personal DM alerts.</p>
        <label style={FIELD_LABEL}>Slack user ID</label>
        <input
          type="text"
          value={slackUserId}
          onChange={(e) => setSlackUserId(e.target.value)}
          placeholder="U012AB3CD (optional)"
        />
        <p style={FIELD_HINT}>Find yours in your Slack profile → More → Profile.</p>
      </div>

      {/* Notification preferences */}
      <div style={{ marginBottom: "24px" }}>
        <p style={SECTION_LABEL}>Notification preferences</p>
        <p style={SECTION_DESC}>Alert channels are configured per contract.</p>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", lineHeight: 1.5 }}>
          To set up email or Slack alerts for a specific contract, open that
          contract and use the <strong style={{ fontWeight: 500, color: "#171717" }}>Alerts</strong> tab
          in the right panel.
        </p>
      </div>

      {error && <p style={{ fontSize: "12px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>}
      {saved && <p style={{ fontSize: "12px", color: "#1a7f4b", marginBottom: "12px" }}>Profile saved.</p>}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 16px",
            background: "#1a7f4b",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: isPending ? "default" : "pointer",
            opacity: isPending ? 0.5 : 1,
            letterSpacing: "-0.01em",
          }}
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
