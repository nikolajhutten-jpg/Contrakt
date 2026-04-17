"use client";

import { useState, useTransition } from "react";
import { inviteUser } from "@/lib/api/users";
import { UserRole } from "@/types";
import type { Department, User } from "@/types";

interface Props {
  departments: Department[];
  onComplete: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.DepartmentOwner]: "Department owner",
  [UserRole.BusinessOwner]: "Business owner",
};

const FIELD_LABEL: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#171717",
  marginBottom: "4px",
};

export default function StepInviteUsers({ departments, onComplete }: Props) {
  const [invited, setInvited] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [fields, setFields] = useState({
    name: "",
    email: "",
    role: UserRole.BusinessOwner as string,
    departmentId: "",
  });

  function set(key: keyof typeof fields) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const user = await inviteUser({
          name: fields.name.trim(),
          email: fields.email.trim(),
          role: fields.role as UserRole,
          departmentId:
            fields.role === UserRole.DepartmentOwner && fields.departmentId
              ? fields.departmentId
              : undefined,
        });
        setInvited((prev) => [...prev, user]);
        setFields({ name: "", email: "", role: UserRole.BusinessOwner, departmentId: "" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to invite user.");
      }
    });
  }

  return (
    <div>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "16px" }}>
        Invite team members to your workspace. You can do this later in user
        management.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={FIELD_LABEL}>Full name</label>
            <input
              type="text"
              required
              value={fields.name}
              onChange={set("name")}
              disabled={isPending}
            />
          </div>
          <div>
            <label style={FIELD_LABEL}>Email</label>
            <input
              type="email"
              required
              value={fields.email}
              onChange={set("email")}
              disabled={isPending}
            />
          </div>
        </div>

        <div>
          <label style={FIELD_LABEL}>Role</label>
          <select
            value={fields.role}
            onChange={set("role")}
            disabled={isPending}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {fields.role === UserRole.DepartmentOwner && departments.length > 0 && (
          <div>
            <label style={FIELD_LABEL}>Department</label>
            <select
              value={fields.departmentId}
              onChange={set("departmentId")}
              disabled={isPending}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p style={{ fontSize: "13px", color: "#c0392b" }}>{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          style={{
            alignSelf: "flex-start",
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 14px",
            background: "rgba(0,0,0,0.05)",
            color: "#171717",
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: "8px",
            cursor: isPending ? "default" : "pointer",
            opacity: isPending ? 0.5 : 1,
          }}
        >
          {isPending ? "Sending invite…" : "Send invite"}
        </button>
      </form>

      {invited.length > 0 && (
        <ul style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px", listStyle: "none", padding: 0 }}>
          {invited.map((u) => (
            <li key={u.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1a7f4b", flexShrink: 0, display: "inline-block" }} />
              {u.name} ({u.email})
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onComplete}
        style={{
          width: "100%",
          fontSize: "13px",
          fontWeight: 500,
          padding: "8px 16px",
          background: "#1a7f4b",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          letterSpacing: "-0.01em",
        }}
      >
        {invited.length > 0 ? "Continue" : "Skip for now"}
      </button>
    </div>
  );
}
