"use client";

import { useState, useTransition } from "react";
import { startCheckout } from "@/lib/api/billing";
import { TenantPlan } from "@/types";

interface Props {
  onComplete: () => void;
}

type Part = "name" | "plan";
type PaidPlan = "starter" | "team" | "business";

const PLANS: Array<{ key: string; label: string; price: string; users: string; contracts: string }> = [
  { key: TenantPlan.Free,     label: "Free",     price: "€0/mo",   users: "1 user",   contracts: "10 contracts" },
  { key: TenantPlan.Starter,  label: "Starter",  price: "€39/mo",  users: "1 user",   contracts: "Unlimited contracts" },
  { key: TenantPlan.Team,     label: "Team",     price: "€59/mo",  users: "5 users",  contracts: "Unlimited contracts" },
  { key: TenantPlan.Business, label: "Business", price: "€129/mo", users: "20 users", contracts: "Unlimited contracts" },
];

const FIELD_LABEL: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#171717",
  marginBottom: "4px",
};

export default function StepOrganisation({ onComplete }: Props) {
  const [part, setPart] = useState<Part>("name");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: orgName.trim() }),
        });
        if (!res.ok) throw new Error("Failed to save.");
        setPart("plan");
      } catch {
        setError("Failed to save. Please try again.");
      }
    });
  }

  function handlePlanSelect(planKey: string) {
    setError("");
    startTransition(async () => {
      try {
        if (planKey === TenantPlan.Free) {
          const res = await fetch("/api/settings/account", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: TenantPlan.Free }),
          });
          if (!res.ok) throw new Error("Failed to save plan.");
          onComplete();
        } else {
          await startCheckout(planKey as PaidPlan);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  if (part === "name") {
    return (
      <div>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "16px" }}>
          This is how your workspace will appear to your team.
        </p>
        <form onSubmit={handleNameSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={FIELD_LABEL}>What&apos;s your organisation called?</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Corp"
              disabled={isPending}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>
          {error && <p style={{ fontSize: "13px", color: "#c0392b" }}>{error}</p>}
          <button
            type="submit"
            disabled={!orgName.trim() || isPending}
            style={{
              width: "100%",
              fontSize: "13px",
              fontWeight: 500,
              padding: "8px 16px",
              background: "#1a7f4b",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: (!orgName.trim() || isPending) ? "default" : "pointer",
              opacity: (!orgName.trim() || isPending) ? 0.5 : 1,
              letterSpacing: "-0.01em",
            }}
          >
            {isPending ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "16px" }}>
        You can upgrade or change your plan at any time from account settings.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "12px" }}>
        {PLANS.map((plan) => (
          <button
            key={plan.key}
            type="button"
            disabled={isPending}
            onClick={() => handlePlanSelect(plan.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              padding: "12px 10px",
              background: "#ffffff",
              border: "0.5px solid rgba(0,0,0,0.12)",
              borderRadius: "10px",
              cursor: isPending ? "default" : "pointer",
              textAlign: "left",
              opacity: isPending ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#171717" }}>{plan.label}</span>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#1a7f4b" }}>{plan.price}</span>
            <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginTop: "4px" }}>{plan.users}</span>
            <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)" }}>{plan.contracts}</span>
          </button>
        ))}
      </div>
      {error && <p style={{ fontSize: "13px", color: "#c0392b" }}>{error}</p>}
    </div>
  );
}
