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

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
}

function UsageMeter({ label, used, limit }: UsageMeterProps) {
  const pct = Math.min((used / limit) * 100, 100);
  const isNearLimit = pct >= 80;
  const isAtLimit = used >= limit;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={isAtLimit ? "text-red-600 font-medium" : "text-gray-500"}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-green-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

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

  const showUsageMeters =
    tenant.plan === TenantPlan.Trial || tenant.plan === TenantPlan.Starter;

  const atContractLimit = usage.contracts >= STARTER_LIMITS.contracts;
  const atUserLimit = usage.users >= STARTER_LIMITS.users;
  const atExtractionLimit = usage.extractionsThisMonth >= STARTER_LIMITS.extractions;
  const anyLimitReached = atContractLimit || atUserLimit || atExtractionLimit;

  function handlePortal() {
    setError("");
    startPortalTransition(async () => {
      try {
        await openBillingPortal();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleCheckout(plan: "starter" | "growth") {
    setError("");
    startCheckoutTransition(async () => {
      try {
        await startCheckout(plan);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="max-w-md">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Billing</h2>

      {/* Plan badge */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {PLAN_LABELS[tenant.plan]}
        </span>
        {isTrialActive && daysLeft !== null && (
          <span className={`text-xs ${daysLeft <= 3 ? "text-red-600" : "text-amber-600"}`}>
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left in trial
          </span>
        )}
        {tenant.plan !== TenantPlan.Trial && (
          <span className="text-xs text-gray-500">{tenant.seatCount} seat{tenant.seatCount !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Read-only banner (§15.4) */}
      {isReadOnly && (
        <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded text-sm text-red-700">
          Your account is in read-only mode. Choose a plan to restore full access.
        </div>
      )}

      {/* Past-due banner */}
      {tenant.planStatus === TenantPlanStatus.PastDue && (
        <div className="mb-4 p-3 border border-amber-200 bg-amber-50 rounded text-sm text-amber-700">
          Your payment is past due. Update your payment method to avoid service interruption.
        </div>
      )}

      {/* Usage meters — Starter / Trial only (§15.6) */}
      {showUsageMeters && (
        <div className="mb-4 space-y-3 p-4 border border-gray-200 rounded">
          <p className="text-xs font-medium text-gray-500 mb-2">Plan usage</p>
          <UsageMeter label="Contracts" used={usage.contracts} limit={STARTER_LIMITS.contracts} />
          <UsageMeter label="Users" used={usage.users} limit={STARTER_LIMITS.users} />
          <UsageMeter label="AI extractions this month" used={usage.extractionsThisMonth} limit={STARTER_LIMITS.extractions} />
        </div>
      )}

      {/* Upgrade prompt (§15.5) */}
      {anyLimitReached && tenant.plan !== TenantPlan.Growth && tenant.plan !== TenantPlan.Enterprise && (
        <div className="mb-4 p-3 border border-amber-200 bg-amber-50 rounded text-sm text-amber-800">
          You&apos;ve reached a plan limit. Upgrade to Growth for unlimited contracts, users, and extractions.
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {(tenant.plan === TenantPlan.Trial || isReadOnly) && (
          <>
            <button
              type="button"
              onClick={() => handleCheckout("starter")}
              disabled={isCheckingOut}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isCheckingOut ? "Loading…" : "Starter — €49/mo"}
            </button>
            <button
              type="button"
              onClick={() => handleCheckout("growth")}
              disabled={isCheckingOut}
              className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isCheckingOut ? "Loading…" : "Growth — €15/user/mo"}
            </button>
          </>
        )}

        {tenant.plan !== TenantPlan.Trial && !isReadOnly && (
          <>
            {tenant.plan === TenantPlan.Starter && (
              <button
                type="button"
                onClick={() => handleCheckout("growth")}
                disabled={isCheckingOut}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isCheckingOut ? "Loading…" : "Upgrade to Growth"}
              </button>
            )}
            <button
              type="button"
              onClick={handlePortal}
              disabled={isOpeningPortal}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isOpeningPortal ? "Loading…" : "Manage billing"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
