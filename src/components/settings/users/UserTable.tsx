"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, deactivateUser, inviteUser } from "@/lib/api/users";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
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

function hasPendingInvite(user: User) {
  return user.clerkId.startsWith("invite:");
}

function isPlaceholderEmail(email: string) {
  return /^invite-\d+@placeholder\.local$/.test(email);
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
  const [isBusy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [role, setRole] = useState(user.role);
  const [departmentId, setDepartmentId] = useState(user.departmentId ?? "");

  const pending = hasPendingInvite(user);
  const displayEmail = isPlaceholderEmail(user.email) ? null : user.email;
  const activeDepts = departments.filter((d) => d.isActive);

  function handleRoleChange(newRole: UserRole) {
    setError(null);
    setResendSuccess(false);
    setRole(newRole);
    // Clear department when switching to Admin; preserve it otherwise.
    const newDeptId = newRole === UserRole.Admin ? null : user.departmentId;
    startTransition(async () => {
      try {
        await updateUserRole(user.id, newRole, newDeptId);
        router.refresh();
      } catch {
        setRole(user.role);
        setError("Failed to update role.");
      }
    });
  }

  function handleDeptChange(deptId: string) {
    setError(null);
    setResendSuccess(false);
    setDepartmentId(deptId);
    startTransition(async () => {
      try {
        await updateUserRole(user.id, user.role, deptId || null);
        router.refresh();
      } catch {
        setDepartmentId(user.departmentId ?? "");
        setError("Failed to update department.");
      }
    });
  }

  function handleResend() {
    setError(null);
    setResendSuccess(false);
    startTransition(async () => {
      try {
        await inviteUser({
          email: user.email,
          name: user.name,
          role: user.role,
          ...(user.departmentId ? { departmentId: user.departmentId } : {}),
        });
        setResendSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to resend invite.");
      }
    });
  }

  function doDeactivate() {
    setConfirmOpen(false);
    setError(null);
    setResendSuccess(false);
    startTransition(async () => {
      try {
        await deactivateUser(user.id);
        onDeactivated(user.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to deactivate.");
      }
    });
  }

  const tdBase: React.CSSProperties = {
    padding: "0 16px",
    fontSize: "13px",
    color: "rgba(0,0,0,0.5)",
    borderBottom: "0.5px solid rgba(0,0,0,0.05)",
    verticalAlign: "middle",
  };

  return (
    <>
      <tr style={{ height: "52px" }}>
        {/* User */}
        <td style={tdBase}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#171717" }}>{user.name}</p>
                {pending && (
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "2px 7px",
                    borderRadius: "20px",
                    background: "rgba(180,83,9,0.1)",
                    color: "#b45309",
                    letterSpacing: "0.01em",
                    flexShrink: 0,
                  }}>
                    Pending
                  </span>
                )}
              </div>
              {displayEmail && (
                <p style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginTop: "1px" }}>{displayEmail}</p>
              )}
              {error && (
                <p style={{ fontSize: "11px", color: "#c0392b", marginTop: "2px" }}>{error}</p>
              )}
              {resendSuccess && (
                <p style={{ fontSize: "11px", color: "#1a7f4b", marginTop: "2px" }}>Invite resent.</p>
              )}
            </div>
          </div>
        </td>

        {/* Role */}
        <td style={tdBase}>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            disabled={isBusy || isSelf}
            style={{ ...COMPACT_SELECT, opacity: (isBusy || isSelf) ? 0.5 : 1 }}
          >
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </td>

        {/* Department */}
        <td style={tdBase}>
          {user.role === UserRole.Admin ? (
            <span style={{ color: "rgba(0,0,0,0.25)" }}>—</span>
          ) : (
            <select
              value={departmentId}
              onChange={(e) => handleDeptChange(e.target.value)}
              disabled={isBusy}
              style={{ ...COMPACT_SELECT, opacity: isBusy ? 0.5 : 1 }}
            >
              <option value="">No department</option>
              {activeDepts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
        </td>

        {/* Joined / Invited */}
        <td style={{ ...tdBase, whiteSpace: "nowrap" }}>
          <p style={{ fontSize: "11px", color: "rgba(0,0,0,0.35)", marginBottom: "1px" }}>
            {pending ? "Invited" : "Joined"}
          </p>
          <p style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)" }}>
            {formatDate(user.createdAt)}
          </p>
        </td>

        {/* Actions */}
        <td style={{ ...tdBase, textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
            {pending && (
              <button
                onClick={handleResend}
                disabled={isBusy}
                style={{
                  fontSize: "12px",
                  color: "#1a7f4b",
                  background: "none",
                  border: "none",
                  cursor: isBusy ? "default" : "pointer",
                  padding: 0,
                  opacity: isBusy ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: "inherit",
                }}
              >
                {isBusy && <Spinner size={12} />}
                Resend
              </button>
            )}
            {!isSelf && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={isBusy}
                style={{
                  fontSize: "12px",
                  color: "rgba(0,0,0,0.4)",
                  background: "none",
                  border: "none",
                  cursor: isBusy ? "default" : "pointer",
                  padding: 0,
                  opacity: isBusy ? 0.5 : 1,
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c0392b"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"; }}
              >
                Deactivate
              </button>
            )}
          </div>
        </td>
      </tr>

      <Modal
        isOpen={confirmOpen}
        title={`Deactivate ${user.name}?`}
        body="This cannot be undone."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={doDeactivate}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

export default function UserTable({ initialUsers, departments, currentUserId }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);

  return (
    <div>
      <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#171717", marginBottom: "10px" }}>
        Team members{" "}
        <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(0,0,0,0.4)" }}>
          {users.length}
        </span>
      </h2>
      <div style={{
        background: "#ffffff",
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
              <th style={TH_STYLE}>User</th>
              <th style={TH_STYLE}>Role</th>
              <th style={TH_STYLE}>Department</th>
              <th style={TH_STYLE}>Joined</th>
              <th style={{ ...TH_STYLE, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: "32px 16px", textAlign: "center", fontSize: "13px", color: "rgba(0,0,0,0.35)" }}
                >
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
