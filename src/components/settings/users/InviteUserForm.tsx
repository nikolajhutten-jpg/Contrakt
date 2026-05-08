"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteUser, ApiError } from "@/lib/api/users";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { UserRole } from "@/types";
import type { Department } from "@/types";

interface InviteUserFormProps {
  departments: Department[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.DepartmentOwner]: "Department owner",
  [UserRole.BusinessOwner]: "Business owner",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#171717",
  marginBottom: "4px",
  display: "block",
};

export default function InviteUserForm({ departments }: InviteUserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.BusinessOwner);
  const [departmentId, setDepartmentId] = useState("");

  const showDeptSelect = role === UserRole.DepartmentOwner;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await inviteUser({
          email,
          name,
          role,
          ...(showDeptSelect && departmentId ? { departmentId } : {}),
        });
        setSuccess(true);
        setEmail("");
        setName("");
        setRole(UserRole.BusinessOwner);
        setDepartmentId("");
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setShowUpgradeModal(true);
        } else {
          setError(err instanceof Error ? err.message : "Failed to invite user.");
        }
      }
    });
  }

  const upgradeModal = showUpgradeModal ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "0.5px solid rgba(0,0,0,0.1)",
          borderRadius: "12px",
          padding: "28px 32px",
          maxWidth: "420px",
          width: "calc(100% - 48px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        <h2
          style={{
            fontSize: "17px",
            fontWeight: 600,
            color: "#171717",
            letterSpacing: "-0.02em",
            marginBottom: "6px",
          }}
        >
          You&apos;ve reached your limit
        </h2>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "24px" }}>
          Upgrade your plan to invite more users.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { window.location.href = "/settings/account"; }}
          >
            Upgrade plan
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowUpgradeModal(false)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#ffffff",
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: "12px",
        padding: "16px 20px",
        maxWidth: "560px",
      }}
    >
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#171717", marginBottom: "16px" }}>
        Invite team member
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <label style={LABEL_STYLE}>Full name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            required placeholder="Jane Smith" />
        </div>
        <div>
          <label style={LABEL_STYLE}>Work email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required placeholder="jane@company.com" />
        </div>
        <div>
          <label style={LABEL_STYLE}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        {showDeptSelect && (
          <div className="fade-in">
            <label style={LABEL_STYLE}>Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Select department</option>
              {departments.filter((d) => d.isActive).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p style={{ fontSize: "12px", color: "#c0392b", marginBottom: "10px" }}>{error}</p>}
      {success && <p style={{ fontSize: "12px", color: "#1a1a1a", marginBottom: "10px" }}>Invite sent successfully.</p>}

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
          {isPending ? "Inviting…" : "Send invite"}
        </button>
      </div>
    </form>
    {upgradeModal}
    </>
  );
}
