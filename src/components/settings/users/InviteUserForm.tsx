"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteUser } from "@/lib/api/users";
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
        setError(err instanceof Error ? err.message : "Failed to invite user.");
      }
    });
  }

  return (
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
      {success && <p style={{ fontSize: "12px", color: "#1a7f4b", marginBottom: "10px" }}>Invite sent successfully.</p>}

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
          {isPending ? "Inviting…" : "Send invite"}
        </button>
      </div>
    </form>
  );
}
