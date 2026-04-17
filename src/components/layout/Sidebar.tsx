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
      className="flex items-center justify-between pr-3 py-1.5 text-[13px] transition-colors"
      style={{
        paddingLeft: indent ? "28px" : "8px",
        borderRadius: "7px",
        // Sub-nav items: active = #1a7f4b text, no background pill
        color: isActive ? (indent ? "#1a7f4b" : "#171717") : "rgba(0,0,0,0.5)",
        fontWeight: isActive ? 500 : 400,
        background: isActive && !indent ? "rgba(0,0,0,0.05)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span>{children}</span>
    </Link>
  );
}

export default function Sidebar({ user, badgeCounts }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === UserRole.Admin;
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-full"
      style={{
        width: "220px",
        background: "#ffffff",
        borderRight: "0.5px solid rgba(0,0,0,0.08)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-14" style={{ padding: "0 16px" }}>
        <span
          style={{
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#171717",
          }}
        >
          Contrakt
        </span>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 flex flex-col overflow-y-auto"
        style={{ padding: "4px 8px", gap: "2px" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const count = item.badge ? badgeCounts[item.badge] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between py-1.5 text-[13px] transition-colors"
              style={{
                paddingLeft: "8px",
                paddingRight: "8px",
                borderRadius: "7px",
                color: isActive ? "#171717" : "rgba(0,0,0,0.5)",
                fontWeight: isActive ? 500 : 400,
                background: isActive ? "rgba(0,0,0,0.05)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span>{item.label}</span>
              {item.badge && count > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[1.25rem] h-[18px] px-1.5 rounded-full"
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    background: "#1a7f4b",
                    color: "#ffffff",
                  }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          );
        })}

        {/* Settings section */}
        <div style={{ marginTop: "16px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "rgba(0,0,0,0.35)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              padding: "0 8px",
              marginBottom: "4px",
            }}
          >
            Settings
          </div>

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
      <div
        style={{
          padding: "12px 16px",
          borderTop: "0.5px solid rgba(0,0,0,0.08)",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "#171717",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.name}
        </p>
        <p
          style={{
            fontSize: "11px",
            marginTop: "2px",
            color: "rgba(0,0,0,0.4)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ROLE_LABEL[user.role] ?? user.role}
        </p>
      </div>
    </aside>
  );
}
