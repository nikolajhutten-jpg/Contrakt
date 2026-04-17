"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, deactivateUser } from "@/lib/api/users";
import { UserRole } from "@/types";
import type { User, Department } from "@/types";

interface UserTableProps {
  initialUsers: User[];
  departments: Department[];
  currentUserId: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.DepartmentOwner]: "Department owner",
  [UserRole.BusinessOwner]: "Business owner",
};

const TH_STYLE: React.CSSProperties = {
  padding: "0 16px",
  height: "36px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.4)",
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const COMPACT_SELECT: React.CSSProperties = {
  height: "30px",
  fontSize: "13px",
  padding: "0 8px",
  borderRadius: "6px",
  border: "0.5px solid rgba(0,0,0,0.15)",
  background: "#ffffff",
  outline: "none",
};

function UserRow({
  user,
  departments,
  isSelf,
  onDeactivated,
}: {
  user: User;
  departments: Department[];
  isSelf: boolean;
  onDeactivated: (id: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRoleChange(newRole: UserRole) {
    setError(null);
    const newDeptId = newRole === UserRole.DepartmentOwner ? user.departmentId : null;
    startTransition(async () => {
      try {
        await updateUserRole(user.id, newRole, newDeptId);
        router.refresh();
      } catch {
        setError("Failed to update role.");
      }
    });
  }

  function handleDeptChange(deptId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updateUserRole(user.id, user.role, deptId || null);
        router.refresh();
      } catch {
        setError("Failed to update department.");
      }
    });
  }

  function handleDeactivate() {
    if (!confirm(`Deactivate ${user.name}? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deactivateUser(user.id);
        onDeactivated(user.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to deactivate.");
      }
    });
  }

  const activeDepts = departments.filter((d) => d.isActive);
  const tdBase: React.CSSProperties = {
    padding: "0 16px",
    fontSize: "13px",
    color: "rgba(0,0,0,0.5)",
    borderBottom: "0.5px solid rgba(0,0,0,0.05)",
    verticalAlign: "middle",
  };

  return (
    <tr
      className="group"
      style={{ height: "48px" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <td style={tdBase}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#171717" }}>{user.name}</p>
        <p style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginTop: "1px" }}>{user.email}</p>
        {error && <p style={{ fontSize: "11px", color: "#c0392b", marginTop: "2px" }}>{error}</p>}
      </td>
      <td style={tdBase}>
        <select
          value={user.role}
          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
          disabled={isPending || isSelf}
          style={{ ...COMPACT_SELECT, opacity: (isPending || isSelf) ? 0.5 : 1 }}
        >
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </td>
      <td style={tdBase}>
        {user.role === UserRole.DepartmentOwner ? (
          <select
            value={user.departmentId ?? ""}
            onChange={(e) => handleDeptChange(e.target.value)}
            disabled={isPending}
            style={{ ...COMPACT_SELECT, opacity: isPending ? 0.5 : 1 }}
          >
            <option value="">No department</option>
            {activeDepts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        ) : (
          <span style={{ color: "rgba(0,0,0,0.25)" }}>—</span>
        )}
      </td>
      <td style={{ ...tdBase, textAlign: "right" }}>
        {!isSelf && (
          <button
            onClick={handleDeactivate}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              fontSize: "12px",
              color: "rgba(0,0,0,0.4)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              opacity: isPending ? 0.5 : undefined,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c0392b"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"; }}
          >
            Deactivate
          </button>
        )}
      </td>
    </tr>
  );
}

export default function UserTable({ initialUsers, departments, currentUserId }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);

  return (
    <div>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginBottom: "10px" }}>
        {users.length} team member{users.length !== 1 ? "s" : ""}
      </p>
      <div style={{ background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", overflow: "hidden" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
              <th style={TH_STYLE}>User</th>
              <th style={TH_STYLE}>Role</th>
              <th style={TH_STYLE}>Department</th>
              <th style={{ ...TH_STYLE, width: "80px" }} />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "32px 16px", textAlign: "center", fontSize: "13px", color: "rgba(0,0,0,0.35)" }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  departments={departments}
                  isSelf={user.id === currentUserId}
                  onDeactivated={(id) => setUsers((prev) => prev.filter((u) => u.id !== id))}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
