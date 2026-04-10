"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepDepartments from "@/components/setup/StepDepartments";
import StepInviteUsers from "@/components/setup/StepInviteUsers";
import StepSlack from "@/components/setup/StepSlack";
import type { Department } from "@/types";

type Step = 1 | 2 | 3;

const STEPS = [
  { number: 1, label: "Departments" },
  { number: 2, label: "Invite users" },
  { number: 3, label: "Slack" },
];

interface Props {
  initialDepartments: Department[];
}

export default function SetupWizard({ initialDepartments }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);

  function handleDepartmentsDone(created: Department[]) {
    setDepartments(created);
    setStep(2);
  }

  function handleInviteDone() {
    setStep(3);
  }

  function handleSlackDone() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded p-8">
        {/* Header */}
        <div className="mb-6">
          <span className="text-lg font-medium text-gray-900">Contrakt</span>
        </div>
        <h1 className="text-base font-medium text-gray-900 mb-1">
          Set up your workspace
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          A few quick steps to get your team started.
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    step === s.number
                      ? "bg-gray-900 text-white"
                      : step > s.number
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s.number ? "✓" : s.number}
                </span>
                <span
                  className={`text-xs ${
                    step === s.number
                      ? "text-gray-900 font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-gray-200 w-8" />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 1 && (
          <StepDepartments
            initial={departments}
            onComplete={handleDepartmentsDone}
          />
        )}
        {step === 2 && (
          <StepInviteUsers
            departments={departments}
            onComplete={handleInviteDone}
          />
        )}
        {step === 3 && <StepSlack onComplete={handleSlackDone} />}
      </div>
    </div>
  );
}
