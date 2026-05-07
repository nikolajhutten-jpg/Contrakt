"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepOrganisation from "@/components/setup/StepOrganisation";
import StepLicense from "@/components/setup/StepLicense";
import StepDepartments from "@/components/setup/StepDepartments";
import StepInviteUsers from "@/components/setup/StepInviteUsers";
import { TenantPlan } from "@/types";
import type { Department } from "@/types";

type Step = 0 | 1 | 2 | 3;

const STEPS = [
  { number: 0, label: "Organisation" },
  { number: 1, label: "License" },
  { number: 2, label: "Departments" },
  { number: 3, label: "Invite" },
];

interface Props {
  initialDepartments: Department[];
}

export default function SetupWizard({ initialDepartments }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  function handleOrganisationDone() {
    setStep(1);
  }

  function handleLicenseDone(plan: string) {
    setSelectedPlan(plan);
    setStep(2);
  }

  function handleDepartmentsDone(created: Department[]) {
    setDepartments(created);
    if (selectedPlan === TenantPlan.Free) {
      router.push("/dashboard");
    } else {
      setStep(3);
    }
  }

  function handleInviteDone() {
    router.push("/dashboard");
  }

  const visibleSteps = selectedPlan === TenantPlan.Free
    ? STEPS.filter((s) => s.number !== 3)
    : STEPS;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: "512px", background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", padding: "32px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "#171717", letterSpacing: "-0.02em" }}>Contrakt</span>
        </div>
        <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#171717", letterSpacing: "-0.02em", marginBottom: "4px" }}>
          Set up your workspace
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "28px" }}>
          A few quick steps to get your team started.
        </p>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
          {visibleSteps.map((s, i) => (
            <div key={s.number} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 500,
                    flexShrink: 0,
                    background: step === s.number ? "#171717" : step > s.number ? "#1a1a1a" : "rgba(0,0,0,0.08)",
                    color: step >= s.number ? "#ffffff" : "rgba(0,0,0,0.4)",
                  }}
                >
                  {step > s.number ? "✓" : i + 1}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: step === s.number ? "#171717" : "rgba(0,0,0,0.4)",
                    fontWeight: step === s.number ? 500 : 400,
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div style={{ width: "32px", height: "0.5px", background: "rgba(0,0,0,0.1)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && (
          <StepOrganisation onComplete={handleOrganisationDone} />
        )}
        {step === 1 && (
          <StepLicense
            onComplete={handleLicenseDone}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepDepartments
            initial={departments}
            onComplete={handleDepartmentsDone}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepInviteUsers
            departments={departments}
            onComplete={handleInviteDone}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
