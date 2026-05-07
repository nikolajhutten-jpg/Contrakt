"use client";

import { useState, useTransition } from "react";
import { startCheckout, openBillingPortal } from "@/lib/api/billing";
import type { Tenant, PlanUsage } from "@/types";
import { TenantPlan, TenantPlanStatus } from "@/types";

const PLAN_LIMITS: Record<TenantPlan, { contracts: number | null; users: number }> = {
  free:     { contracts: 10,   users: 1 },
  starter:  { contracts: null, users: 1 },
  team:     { contracts: null, users: 5 },
  business: { contracts: null, users: 20 },
};

const PLANS = [
  { key: TenantPlan.Free,     label: "Free",     price: "€0/mo",   users: "1 user",   contracts: "10 contracts" },
  { key: TenantPlan.Starter,  label: "Starter",  price: "€39/mo",  users: "1 user",   contracts: "Unlimited contracts" },
  { key: TenantPlan.Team,     label: "Team",     price: "€59/mo",  users: "5 users",  contracts: "Unlimited contracts" },
  { key: TenantPlan.Business, label: "Business", price: "€129/mo", users: "20 users", contracts: "Unlimited contracts" },
];

interface Props {
  tenant: Tenant;
  usage: PlanUsage;
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  const atLimit = used >= limit;
  const nearLimit = pct >= 80;
  const barColor = atLimit ? "#ef4444" : nearLimit ? "#d97706" : "#1a1a1a";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "12px", color: atLimit ? "#c0392b" : "rgba(0,0,0,0.5)", width: "180px", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "4px", borderRadius: "12px", background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: "12px", background: barColor, width: `${pct}%`, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "12px", color: atLimit ? "#c0392b" : "rgba(0,0,0,0.4)", width: "60px", textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
        {used} / {limit}
      </span>
    </div>
  );
}

const BTN_SECONDARY: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  padding: "7px 16px",
  background: "rgba(0,0,0,0.05)",
  color: "inherit",
  border: "0.5px solid rgba(0,0,0,0.1)",
  borderRadius: "8px",
  cursor: "pointer",
  letterSpacing: "-0.01em",
};

export default function BillingSection({ tenant, usage }: Props) {
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isCheckingOut, startCheckoutTransition] = useTransition();
  const [isOpeningPortal, startPortalTransition] = useTransition();

  const isReadOnly = tenant.planStatus === TenantPlanStatus.ReadOnly;
  const limits = PLAN_LIMITS[tenant.plan];
  const atContractLimit = limits.contracts !== null && usage.contracts >= limits.contracts;
  const atUserLimit = usage.users >= limits.users;
  const anyLimitReached = atContractLimit || atUserLimit;

  const selectedPlanData = selectedPlan ? PLANS.find((p) => p.key === selectedPlan) : null;
  const canUpgrade = selectedPlan !== null && selectedPlan !== tenant.plan && selectedPlan !== TenantPlan.Free;

  function handlePortal() {
    setError("");
    startPortalTransition(async () => {
      try { await openBillingPortal(); }
      catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    });
  }

  function handleCheckout(plan: "starter" | "team" | "business") {
    setError("");
    startCheckoutTransition(async () => {
      try { await startCheckout(plan); }
      catch (err) {
        const msg = err instanceof Error ? err.message : "";
        setError(
          msg.toLowerCase().includes("not configured")
            ? "Stripe is not configured yet. Please contact support."
            : "Something went wrong. Please try again."
        );
      }
    });
  }

  return (
    <div style={{ maxWidth: "480px" }}>
      <p style={{ fontSize: "13px", fontWeight: 600, color: "#171717", marginBottom: "16px" }}>Billing</p>

      {/* Banners */}
      {isReadOnly && (
        <div style={{ marginBottom: "16px", padding: "10px 12px", background: "#fdecea", border: "0.5px solid rgba(192,57,43,0.2)", borderRadius: "8px", fontSize: "13px", color: "#c0392b" }}>
          Your account is in read-only mode. Choose a plan to restore full access.
        </div>
      )}
      {tenant.planStatus === TenantPlanStatus.PastDue && (
        <div style={{ marginBottom: "16px", padding: "10px 12px", background: "#fff3e0", border: "0.5px solid rgba(180,83,9,0.2)", borderRadius: "8px", fontSize: "13px", color: "#b45309" }}>
          Your payment is past due. Update your payment method to avoid service interruption.
        </div>
      )}

      {/* Usage meters */}
      <div style={{ marginBottom: "16px", padding: "14px 16px", background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <p style={{ fontSize: "11px", fontWeight: 500, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Plan usage</p>
        {limits.contracts !== null && (
          <UsageMeter label="Contracts" used={usage.contracts} limit={limits.contracts} />
        )}
        <UsageMeter label="Users" used={usage.users} limit={limits.users} />
      </div>

      {/* Upgrade prompt */}
      {anyLimitReached && tenant.plan !== TenantPlan.Team && tenant.plan !== TenantPlan.Business && (
        <div style={{ marginBottom: "16px", padding: "10px 12px", background: "#fff3e0", border: "0.5px solid rgba(180,83,9,0.2)", borderRadius: "8px", fontSize: "13px", color: "#b45309" }}>
          You&apos;ve reached a plan limit. Upgrade for more contracts and users.
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "12px" }}>
        {PLANS.map((plan) => {
          const isCurrent = tenant.plan === plan.key;
          const isSelected = selectedPlan === plan.key;
          const isPaid = plan.key !== TenantPlan.Free;
          const isClickable = !isCurrent && isPaid && !isCheckingOut;
          const highlighted = isCurrent || isSelected;
          return (
            <button
              key={plan.key}
              type="button"
              disabled={!isClickable}
              onClick={isClickable ? () => setSelectedPlan(plan.key) : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                padding: "12px 10px",
                background: highlighted ? "rgba(0,0,0,0.04)" : "#ffffff",
                border: highlighted ? "1.5px solid #1a1a1a" : "0.5px solid rgba(0,0,0,0.12)",
                borderRadius: "10px",
                cursor: isClickable ? "pointer" : "default",
                textAlign: "left",
                opacity: isCheckingOut && !isSelected ? 0.5 : 1,
                transition: "border-color 0.12s, background 0.12s",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#171717" }}>{plan.label}</span>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#1a1a1a" }}>{plan.price}</span>
              <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginTop: "4px" }}>{plan.users}</span>
              <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)" }}>{plan.contracts}</span>
              {isCurrent && (
                <span style={{ fontSize: "10px", fontWeight: 500, color: "rgba(0,0,0,0.4)", marginTop: "4px" }}>Current plan</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Upgrade button */}
      {canUpgrade && (
        <div style={{ marginBottom: "12px" }}>
          <button
            type="button"
            disabled={isCheckingOut}
            onClick={() => handleCheckout(selectedPlan as "starter" | "team" | "business")}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              padding: "7px 16px",
              background: "#1a1a1a",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: isCheckingOut ? "default" : "pointer",
              letterSpacing: "-0.01em",
              opacity: isCheckingOut ? 0.5 : 1,
            }}
          >
            {isCheckingOut ? "Loading…" : `Upgrade to ${selectedPlanData?.label}`}
          </button>
        </div>
      )}

      {error && <p style={{ fontSize: "13px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>}

      {/* Manage billing — paid plans only */}
      {tenant.plan !== TenantPlan.Free && !isReadOnly && (
        <button type="button" onClick={handlePortal} disabled={isOpeningPortal}
          style={{ ...BTN_SECONDARY, opacity: isOpeningPortal ? 0.5 : 1, cursor: isOpeningPortal ? "default" : "pointer" }}>
          {isOpeningPortal ? "Loading…" : "Manage billing"}
        </button>
      )}
    </div>
  );
}
