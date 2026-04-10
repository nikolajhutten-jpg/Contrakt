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
  badge?: "actionRequired";
}

interface SettingsSubItem {
  label: string;
  href: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard" },
  { label: "All contracts", href: "/contracts" },
  { label: "Action required", href: "/action-required", badge: "actionRequired" },
];

const SETTINGS_SUB_ITEMS: SettingsSubItem[] = [
  { label: "Account", href: "/settings/account", adminOnly: true },
  { label: "Users", href: "/settings/users", adminOnly: true },
  { label: "Departments", href: "/settings/departments", adminOnly: true },
  { label: "Group entities", href: "/settings/group-entities", adminOnly: true },
  { label: "Profile", href: "/settings/profile" },
];

const ROLE_LABEL: Record<string, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.DepartmentOwner]: "Department owner",
  [UserRole.BusinessOwner]: "Business owner",
};

function navItemStyle(isActive: boolean) {
  return isActive
    ? { backgroundColor: "var(--green-800)", color: "#ffffff", fontWeight: 500 }
    : undefined;
}

function NavLink({
  href,
  isActive,
  children,
  indent = false,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
  indent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between ${indent ? "pl-8" : "pl-5"} pr-4 py-2 text-sm transition-colors rounded-r-md mr-3`}
      style={navItemStyle(isActive)}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLElement).style.backgroundColor = "";
      }}
    >
      <span style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)" }}>
        {children}
      </span>
    </Link>
  );
}

export default function Sidebar({ user, badgeCounts }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === UserRole.Admin;
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{ backgroundColor: "var(--green-900)" }}
    >
      {/* Logo */}
      <div className="px-5 h-14 flex items-center">
        <span className="text-base font-semibold text-white tracking-tight">
          Contrakt
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 flex flex-col gap-0.5 overflow-y-auto">
        {/* Main nav items */}
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const count = item.badge ? badgeCounts[item.badge] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between pl-5 pr-4 py-2 text-sm transition-colors rounded-r-md mr-3"
              style={navItemStyle(isActive)}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.backgroundColor = "";
              }}
            >
              <span style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)" }}>
                {item.label}
              </span>
              {item.badge && count > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "var(--green-500)", color: "var(--green-900)" }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          );
        })}

        {/* Settings section */}
        <div className="mt-0.5">
          {/* Settings label — not a link, just a section header */}
          <div
            className="flex items-center pl-5 pr-4 py-2 text-sm"
            style={{ color: isSettingsActive ? "#ffffff" : "rgba(255,255,255,0.75)", fontWeight: isSettingsActive ? 500 : undefined }}
          >
            Settings
          </div>

          {/* Sub-items — always visible (no collapse animation needed) */}
          {SETTINGS_SUB_ITEMS.map((sub) => {
            if (sub.adminOnly && !isAdmin) return null;
            const isActive = pathname.startsWith(sub.href);
            return (
              <NavLink key={sub.href} href={sub.href} isActive={isActive} indent>
                {sub.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User identity */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <p className="text-sm font-medium text-white truncate">{user.name}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
          {ROLE_LABEL[user.role] ?? user.role}
        </p>
      </div>
    </aside>
  );
}
