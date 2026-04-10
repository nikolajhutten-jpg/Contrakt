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
      className="bg-white border border-gray-200 rounded p-5 max-w-lg"
    >
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Smith"
            className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Work email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="jane@company.com"
            className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        {showDeptSelect && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="">Select department</option>
              {departments.filter((d) => d.isActive).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      {success && (
        <p className="text-xs text-green-600 mb-3">User invited successfully.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Inviting…" : "Send invite"}
      </button>
    </form>
  );
}
