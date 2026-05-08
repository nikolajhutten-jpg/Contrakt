"use client";

import { useState } from "react";
import type { TenantWithUserCount } from "@/lib/db/tenants";
import { TenantPlan, TenantPlanStatus } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_USER_LIMITS: Record<TenantPlan, number> = {
  free: 1,
  starter: 1,
  team: 5,
  business: 20,
};

const ALL_PLANS = [TenantPlan.Free, TenantPlan.Starter, TenantPlan.Team, TenantPlan.Business] as const;

// ─── Styles ───────────────────────────────────────────────────────────────────

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

const TD_STYLE: React.CSSProperties = {
  padding: "0 16px",
  height: "48px",
  fontSize: "13px",
  color: "rgba(0,0,0,0.5)",
  borderBottom: "0.5px solid rgba(0,0,0,0.05)",
  whiteSpace: "nowrap",
};

// ─── Badge helpers ────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<TenantPlan, React.CSSProperties> = {
  free:     { background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.45)" },
  starter:  { background: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.55)" },
  team:     { background: "rgba(0,0,0,0.14)", color: "rgba(0,0,0,0.70)" },
  business: { background: "rgba(0,0,0,0.80)", color: "#ffffff" },
};

const STATUS_BADGE: Record<TenantPlanStatus, React.CSSProperties> = {
  active:    { background: "#e6f4ec", color: "#1a1a1a" },
  past_due:  { background: "#fff3e0", color: "#b45309" },
  read_only: { background: "#fdecea", color: "#c0392b" },
  canceled:  { background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.45)" },
};

const STATUS_LABELS: Record<TenantPlanStatus, string> = {
  active: "Active",
  past_due: "Past due",
  read_only: "Suspended",
  canceled: "Canceled",
};

function Pill({ style, label }: { style: React.CSSProperties; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "20px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {label}
    </span>
  );
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AdminShellProps {
  initialTenants: TenantWithUserCount[];
}

export default function AdminShell({ initialTenants }: AdminShellProps) {
  const [tenants, setTenants] = useState(initialTenants);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, TenantPlan>>(
    () => Object.fromEntries(initialTenants.map((t) => [t.id, t.plan])),
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [suspending, setSuspending] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setError(id: string, msg: string) {
    setErrors((prev) => ({ ...prev, [id]: msg }));
  }

  function clearError(id: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  async function savePlan(tenant: TenantWithUserCount) {
    const plan = selectedPlans[tenant.id];
    if (plan === tenant.plan) return;
    clearError(tenant.id);
    setSaving((prev) => ({ ...prev, [tenant.id]: true }));

    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, planStatus: TenantPlanStatus.Active }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json() as { data: TenantWithUserCount };
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, plan: data.plan, planStatus: data.planStatus } : t)),
      );
    } catch {
      setError(tenant.id, "Failed to update plan.");
    } finally {
      setSaving((prev) => ({ ...prev, [tenant.id]: false }));
    }
  }

  async function toggleSuspend(tenant: TenantWithUserCount) {
    const isSuspended =
      tenant.planStatus === TenantPlanStatus.ReadOnly ||
      tenant.planStatus === TenantPlanStatus.Canceled;
    const newStatus = isSuspended ? TenantPlanStatus.Active : TenantPlanStatus.ReadOnly;
    clearError(tenant.id);
    setSuspending((prev) => ({ ...prev, [tenant.id]: true }));

    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planStatus: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json() as { data: TenantWithUserCount };
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, planStatus: data.planStatus } : t)),
      );
    } catch {
      setError(tenant.id, "Failed to update status.");
    } finally {
      setSuspending((prev) => ({ ...prev, [tenant.id]: false }));
    }
  }

  return (
    <div style={{ padding: "32px 32px", maxWidth: "1400px" }}>
      <h1
        style={{
          fontSize: "22px",
          fontWeight: 600,
          color: "#171717",
          letterSpacing: "-0.02em",
          marginBottom: "24px",
        }}
      >
        Admin
      </h1>

      <div
        style={{
          background: "#ffffff",
          border: "0.5px solid rgba(0,0,0,0.08)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
              <th style={TH_STYLE}>Tenant</th>
              <th style={TH_STYLE}>Plan</th>
              <th style={TH_STYLE}>Status</th>
              <th style={TH_STYLE}>Users</th>
              <th style={TH_STYLE}>Created</th>
              <th style={{ ...TH_STYLE, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    fontSize: "13px",
                    color: "rgba(0,0,0,0.35)",
                  }}
                >
                  No tenants.
                </td>
              </tr>
            )}
            {tenants.map((tenant) => {
              const isSuspended =
                tenant.planStatus === TenantPlanStatus.ReadOnly ||
                tenant.planStatus === TenantPlanStatus.Canceled;
              const planChanged = selectedPlans[tenant.id] !== tenant.plan;
              const userLimit = PLAN_USER_LIMITS[tenant.plan];
              const isSaving = saving[tenant.id] ?? false;
              const isSuspending = suspending[tenant.id] ?? false;
              const error = errors[tenant.id];

              return (
                <tr key={tenant.id}>
                  {/* Name */}
                  <td style={{ ...TD_STYLE, color: "#171717", fontWeight: 500 }}>
                    <div>{tenant.name}</div>
                    {error && (
                      <div style={{ fontSize: "11px", color: "#c0392b", marginTop: "2px" }}>
                        {error}
                      </div>
                    )}
                  </td>

                  {/* Plan badge */}
                  <td style={TD_STYLE}>
                    <Pill
                      style={PLAN_BADGE[tenant.plan]}
                      label={tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                    />
                  </td>

                  {/* Status badge */}
                  <td style={TD_STYLE}>
                    <Pill
                      style={STATUS_BADGE[tenant.planStatus]}
                      label={STATUS_LABELS[tenant.planStatus]}
                    />
                  </td>

                  {/* Users */}
                  <td style={TD_STYLE}>
                    {tenant._count.users} / {userLimit}
                  </td>

                  {/* Created */}
                  <td style={TD_STYLE}>{formatDate(tenant.createdAt)}</td>

                  {/* Actions */}
                  <td style={{ ...TD_STYLE, overflow: "visible" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        justifyContent: "flex-end",
                      }}
                    >
                      {/* Plan select + save */}
                      <select
                        value={selectedPlans[tenant.id] ?? tenant.plan}
                        onChange={(e) =>
                          setSelectedPlans((prev) => ({
                            ...prev,
                            [tenant.id]: e.target.value as TenantPlan,
                          }))
                        }
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "0.5px solid rgba(0,0,0,0.15)",
                          background: "#ffffff",
                          color: "#171717",
                          cursor: "pointer",
                        }}
                      >
                        {ALL_PLANS.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>

                      {planChanged && (
                        <button
                          onClick={() => savePlan(tenant)}
                          disabled={isSaving}
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#1a1a1a",
                            color: "#ffffff",
                            cursor: isSaving ? "not-allowed" : "pointer",
                            opacity: isSaving ? 0.6 : 1,
                          }}
                        >
                          {isSaving ? "Saving…" : "Save"}
                        </button>
                      )}

                      {/* Suspend / Unsuspend */}
                      <button
                        onClick={() => toggleSuspend(tenant)}
                        disabled={isSuspending}
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: isSuspending ? "not-allowed" : "pointer",
                          opacity: isSuspending ? 0.6 : 1,
                          background: isSuspended ? "rgba(0,0,0,0.08)" : "#fff3e0",
                          color: isSuspended ? "#1a1a1a" : "#b45309",
                        }}
                      >
                        {isSuspending
                          ? "…"
                          : isSuspended
                          ? "Unsuspend"
                          : "Suspend"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
