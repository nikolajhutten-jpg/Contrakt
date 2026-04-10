"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@/types";
import type { BadgeCounts } from "@/lib/db/dashboard";

interface SidebarProps {
  user: {
    name: string;
    role: string;
  };
  badgeCounts: BadgeCounts;
}

interface NavItem {
  label: string;
  href: string;
  badge?: "actionRequired" | "renewals";
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "All contracts", href: "/contracts" },
  { label: "Renewals", href: "/renewals", badge: "renewals" },
  {
    label: "Action required",
    href: "/action-required",
    badge: "actionRequired",
  },
  { label: "Users", href: "/settings/users", adminOnly: true },
  { label: "Settings", href: "/settings" },
];

const ROLE_LABEL: Record<string, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.DepartmentOwner]: "Department owner",
  [UserRole.BusinessOwner]: "Business owner",
};

export default function Sidebar({ user, badgeCounts }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === UserRole.Admin;

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center border-b border-gray-200">
        <span className="text-base font-medium text-gray-900 tracking-tight">
          Contrakt
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          const isActive =
            item.href === "/settings"
              ? pathname.startsWith("/settings") &&
                !pathname.startsWith("/settings/users")
              : pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href + "/"));

          const count = item.badge ? badgeCounts[item.badge] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{item.label}</span>
              {item.badge && count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium ${
                    item.badge === "actionRequired"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User identity */}
      <div className="px-5 py-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {ROLE_LABEL[user.role] ?? user.role}
        </p>
      </div>
    </aside>
  );
}
