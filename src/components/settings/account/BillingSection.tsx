"use client";

import { useState, useTransition } from "react";
import { startCheckout, openBillingPortal } from "@/lib/api/billing";
import type { Tenant, PlanUsage } from "@/types";
import { TenantPlan, TenantPlanStatus } from "@/types";

// §15.2 limits — mirrored here for display; enforcement is server-side in planLimits.ts
const STARTER_LIMITS = { contracts: 50, users: 5, extractions: 20 };

const PLAN_LABELS: Record<TenantPlan, string> = {
  trial: "Trial",
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

interface Props {
  tenant: Tenant;
  usage: PlanUsage;
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  const atLimit = used >= limit;
  const nearLimit = pct >= 80;
  const barColor = atLimit ? "#ef4444" : nearLimit ? "#d97706" : "#1a7f4b";

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

const BTN_PRIMARY: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  padding: "7px 16px",
  background: "#1a7f4b",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  letterSpacing: "-0.01em",
};

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
  const [isCheckingOut, startCheckoutTransition] = useTransition();
  const [isOpeningPortal, startPortalTransition] = useTransition();

  const isTrialActive =
    tenant.plan === TenantPlan.Trial &&
    tenant.planStatus === TenantPlanStatus.Active &&
    tenant.trialEndsAt !== null;

  const isReadOnly = tenant.planStatus === TenantPlanStatus.ReadOnly;

  const daysLeft = tenant.trialEndsAt
    ? Math.max(0, Math.ceil((tenant.trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : null;

  const showUsageMeters = tenant.plan === TenantPlan.Trial || tenant.plan === TenantPlan.Starter;
  const atContractLimit = usage.contracts >= STARTER_LIMITS.contracts;
  const atUserLimit = usage.users >= STARTER_LIMITS.users;
  const atExtractionLimit = usage.extractionsThisMonth >= STARTER_LIMITS.extractions;
  const anyLimitReached = atContractLimit || atUserLimit || atExtractionLimit;

  function handlePortal() {
    setError("");
    startPortalTransition(async () => {
      try { await openBillingPortal(); }
      catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    });
  }

  function handleCheckout(plan: "starter" | "growth") {
    setError("");
    startCheckoutTransition(async () => {
      try { await startCheckout(plan); }
      catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    });
  }

  return (
    <div style={{ maxWidth: "480px" }}>
      <p style={{ fontSize: "13px", fontWeight: 600, color: "#171717", marginBottom: "16px" }}>Billing</p>

      {/* Plan + trial badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "20px", padding: "2px 8px", fontSize: "11px", fontWeight: 500, background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)" }}>
          {PLAN_LABELS[tenant.plan]}
        </span>
        {isTrialActive && daysLeft !== null && (
          <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "20px", padding: "2px 8px", fontSize: "11px", fontWeight: 500, background: daysLeft <= 3 ? "#fdecea" : "#fff3e0", color: daysLeft <= 3 ? "#c0392b" : "#b45309" }}>
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left in trial
          </span>
        )}
        {tenant.plan !== TenantPlan.Trial && (
          <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)" }}>
            {tenant.seatCount} seat{tenant.seatCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

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
      {showUsageMeters && (
        <div style={{ marginBottom: "16px", padding: "14px 16px", background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Plan usage</p>
          <UsageMeter label="Contracts" used={usage.contracts} limit={STARTER_LIMITS.contracts} />
          <UsageMeter label="Users" used={usage.users} limit={STARTER_LIMITS.users} />
          <UsageMeter label="AI extractions this month" used={usage.extractionsThisMonth} limit={STARTER_LIMITS.extractions} />
        </div>
      )}

      {/* Upgrade prompt */}
      {anyLimitReached && tenant.plan !== TenantPlan.Growth && tenant.plan !== TenantPlan.Enterprise && (
        <div style={{ marginBottom: "16px", padding: "10px 12px", background: "#fff3e0", border: "0.5px solid rgba(180,83,9,0.2)", borderRadius: "8px", fontSize: "13px", color: "#b45309" }}>
          You&apos;ve reached a plan limit. Upgrade to Growth for unlimited contracts, users, and extractions.
        </div>
      )}

      {error && <p style={{ fontSize: "13px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(tenant.plan === TenantPlan.Trial || isReadOnly) && (
          <>
            <button type="button" onClick={() => handleCheckout("starter")} disabled={isCheckingOut}
              style={{ ...BTN_SECONDARY, opacity: isCheckingOut ? 0.5 : 1, cursor: isCheckingOut ? "default" : "pointer" }}>
              {isCheckingOut ? "Loading…" : "Starter — €49/mo"}
            </button>
            <button type="button" onClick={() => handleCheckout("growth")} disabled={isCheckingOut}
              style={{ ...BTN_PRIMARY, opacity: isCheckingOut ? 0.5 : 1, cursor: isCheckingOut ? "default" : "pointer" }}>
              {isCheckingOut ? "Loading…" : "Growth — €15/user/mo"}
            </button>
          </>
        )}
        {tenant.plan !== TenantPlan.Trial && !isReadOnly && (
          <>
            {tenant.plan === TenantPlan.Starter && (
              <button type="button" onClick={() => handleCheckout("growth")} disabled={isCheckingOut}
                style={{ ...BTN_PRIMARY, opacity: isCheckingOut ? 0.5 : 1, cursor: isCheckingOut ? "default" : "pointer" }}>
                {isCheckingOut ? "Loading…" : "Upgrade to Growth"}
              </button>
            )}
            <button type="button" onClick={handlePortal} disabled={isOpeningPortal}
              style={{ ...BTN_SECONDARY, opacity: isOpeningPortal ? 0.5 : 1, cursor: isOpeningPortal ? "default" : "pointer" }}>
              {isOpeningPortal ? "Loading…" : "Manage billing"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
