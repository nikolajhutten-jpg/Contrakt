"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startCheckout } from "@/lib/api/billing";
import Button from "@/components/ui/Button";
import { TenantPlan } from "@/types";

type PaidPlan = "starter" | "team" | "business";

const PLANS: Array<{ key: string; label: string; price: string; users: string; contracts: string }> = [
  { key: TenantPlan.Free,     label: "Free",     price: "€0/mo",   users: "1 user",   contracts: "10 contracts" },
  { key: TenantPlan.Starter,  label: "Starter",  price: "€39/mo",  users: "1 user",   contracts: "Unlimited contracts" },
  { key: TenantPlan.Team,     label: "Team",     price: "€59/mo",  users: "5 users",  contracts: "Unlimited contracts" },
  { key: TenantPlan.Business, label: "Business", price: "€129/mo", users: "20 users", contracts: "Unlimited contracts" },
];

interface Props {
  onBack: () => void;
}

export default function StepLicense({ onBack }: Props) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleGetStarted() {
    if (!selectedPlan) return;
    setError("");
    startTransition(async () => {
      try {
        if (selectedPlan === TenantPlan.Free) {
          const planRes = await fetch("/api/settings/account", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: TenantPlan.Free }),
          });
          if (!planRes.ok) throw new Error("Failed to save plan.");
          const completeRes = await fetch("/api/setup/complete", { method: "PATCH" });
          if (!completeRes.ok) throw new Error("Failed to complete setup.");
          router.push("/dashboard");
        } else {
          await startCheckout(selectedPlan as PaidPlan);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "16px" }}>
        You can upgrade or change your plan at any time from account settings.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "12px" }}>
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.key;
          return (
            <button
              key={plan.key}
              type="button"
              disabled={isPending}
              onClick={() => setSelectedPlan(plan.key)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                padding: "12px 10px",
                background: isSelected ? "rgba(0,0,0,0.04)" : "#ffffff",
                border: isSelected ? "1.5px solid #1a1a1a" : "0.5px solid rgba(0,0,0,0.12)",
                borderRadius: "10px",
                cursor: isPending ? "default" : "pointer",
                textAlign: "left",
                opacity: isPending ? 0.5 : 1,
                transition: "border-color 0.12s, background 0.12s",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#171717" }}>{plan.label}</span>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#1a1a1a" }}>{plan.price}</span>
              <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginTop: "4px" }}>{plan.users}</span>
              <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)" }}>{plan.contracts}</span>
            </button>
          );
        })}
      </div>
      {error && <p style={{ fontSize: "13px", color: "#c0392b", marginBottom: "8px" }}>{error}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button
          type="button"
          variant="primary"
          disabled={!selectedPlan || isPending}
          onClick={handleGetStarted}
          style={{ width: "100%", padding: "8px 16px" }}
        >
          {isPending ? "Loading…" : "Get started"}
        </Button>
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          style={{
            fontSize: "13px",
            color: "rgba(0,0,0,0.4)",
            background: "none",
            border: "none",
            cursor: isPending ? "default" : "pointer",
            padding: "4px 0",
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
