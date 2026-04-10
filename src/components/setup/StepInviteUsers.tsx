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
      <p className="text-sm text-gray-600 mb-4">
        Invite team members to your workspace. You can do this later in user
        management.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              type="text"
              required
              value={fields.name}
              onChange={set("name")}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={fields.email}
              onChange={set("email")}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              disabled={isPending}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={fields.role}
            onChange={set("role")}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={fields.departmentId}
              onChange={set("departmentId")}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {isPending ? "Sending invite…" : "Send invite"}
        </button>
      </form>

      {invited.length > 0 && (
        <ul className="text-sm text-gray-600 space-y-1 mb-4">
          {invited.map((u) => (
            <li key={u.id} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              {u.name} ({u.email})
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onComplete}
          className="flex-1 bg-gray-900 text-white text-sm font-medium py-2 rounded hover:bg-gray-700 transition-colors"
        >
          {invited.length > 0 ? "Continue" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
