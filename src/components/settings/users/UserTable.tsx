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

  return (
    <tr className="bg-white hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-400">{user.email}</p>
        {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
      </td>
      <td className="px-4 py-3">
        <select
          value={user.role}
          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
          disabled={isPending || isSelf}
          className="px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
        >
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        {user.role === UserRole.DepartmentOwner ? (
          <select
            value={user.departmentId ?? ""}
            onChange={(e) => handleDeptChange(e.target.value)}
            disabled={isPending}
            className="px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
          >
            <option value="">No department</option>
            {activeDepts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {!isSelf && (
          <button
            onClick={handleDeactivate}
            disabled={isPending}
            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
          >
            Deactivate
          </button>
        )}
      </td>
    </tr>
  );
}

export default function UserTable({
  initialUsers,
  departments,
  currentUserId,
}: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);

  return (
    <div className="border border-gray-200 rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-2.5 text-left font-medium text-gray-600">User</th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600">Role</th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600">Department</th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
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
                onDeactivated={(id) =>
                  setUsers((prev) => prev.filter((u) => u.id !== id))
                }
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
