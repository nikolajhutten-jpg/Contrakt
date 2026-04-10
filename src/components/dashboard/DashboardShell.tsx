"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import KpiRow from "@/components/dashboard/KpiRow";
import ContractTable from "@/components/dashboard/ContractTable";
import EmptyState from "@/components/ui/EmptyState";
import type { DashboardKpis, OnboardingState } from "@/lib/db/dashboard";
import type { ContractSummary } from "@/types";

const CHECKLIST_DISMISSED_KEY = "contrakt_onboarding_dismissed";

interface ChecklistItemProps {
  done: boolean;
  label: string;
}

function ChecklistItem({ done, label }: ChecklistItemProps) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
          done ? "bg-green-500" : "bg-gray-200"
        }`}
      >
        {done && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="currentColor">
            <path d="M8.5 2.5 4 7 1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        )}
      </span>
      <span className={done ? "text-gray-400 line-through" : "text-gray-700"}>
        {label}
      </span>
    </li>
  );
}

interface DashboardShellProps {
  kpis: DashboardKpis;
  actionRequired: ContractSummary[];
  upcomingRenewals: ContractSummary[];
  onboarding: OnboardingState;
  isAdmin: boolean;
}

export default function DashboardShell({
  kpis,
  actionRequired,
  upcomingRenewals,
  onboarding,
  isAdmin,
}: DashboardShellProps) {
  const router = useRouter();
  const [checklistDismissed, setChecklistDismissed] = useState(true);

  // Read dismissal state from localStorage after mount
  useEffect(() => {
    setChecklistDismissed(
      localStorage.getItem(CHECKLIST_DISMISSED_KEY) === "true",
    );
  }, []);

  function dismissChecklist() {
    localStorage.setItem(CHECKLIST_DISMISSED_KEY, "true");
    setChecklistDismissed(true);
  }

  const allOnboardingDone =
    onboarding.departmentsAdded &&
    onboarding.firstUserInvited &&
    onboarding.slackConnected &&
    onboarding.firstContractUploaded;

  const showChecklist = isAdmin && !checklistDismissed && !allOnboardingDone;

  return (
    <div className="px-8 py-6 max-w-screen-xl">
      <h1 className="text-xl font-medium text-gray-900 mb-6">Dashboard</h1>

      {/* Onboarding checklist (§13.7) */}
      {showChecklist && (
        <div className="mb-6 bg-white border border-gray-200 rounded p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium text-gray-900">
                Get started with Contrakt
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete these steps to finish setting up your workspace.
              </p>
            </div>
            <button
              onClick={dismissChecklist}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
          <ul className="space-y-2">
            <ChecklistItem done label="Account created" />
            <ChecklistItem
              done={onboarding.departmentsAdded}
              label="Add a department"
            />
            <ChecklistItem
              done={onboarding.firstUserInvited}
              label="Invite a team member"
            />
            <ChecklistItem
              done={onboarding.slackConnected}
              label="Connect Slack"
            />
            <ChecklistItem
              done={onboarding.firstContractUploaded}
              label="Upload your first contract"
            />
          </ul>
        </div>
      )}

      {/* KPI row */}
      <div className="mb-8">
        <KpiRow kpis={kpis} />
      </div>

      {/* Action required section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <h2 className="text-sm font-medium text-gray-900">Action required</h2>
          {actionRequired.length > 0 && (
            <span className="text-xs text-red-600 font-medium">
              {actionRequired.length} contract
              {actionRequired.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {actionRequired.length === 0 ? (
          <EmptyState
            heading="No action required"
            subtext="Contracts needing attention will appear here."
            actionLabel="View all contracts"
            onAction={() => router.push("/contracts")}
          />
        ) : (
          <ContractTable contracts={actionRequired} />
        )}
      </section>

      {/* Upcoming renewals section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
          <h2 className="text-sm font-medium text-gray-900">
            Upcoming renewals
          </h2>
          {upcomingRenewals.length > 0 && (
            <span className="text-xs text-amber-600 font-medium">
              {upcomingRenewals.length} contract
              {upcomingRenewals.length !== 1 ? "s" : ""} within 90 days
            </span>
          )}
        </div>
        {upcomingRenewals.length === 0 ? (
          <EmptyState
            heading="No upcoming renewals"
            subtext="Contracts with approaching renewal deadlines will appear here."
            actionLabel="Upload a contract"
            onAction={() => router.push("/contracts/new")}
          />
        ) : (
          <ContractTable
            contracts={upcomingRenewals}
            forceRenewalDueBadge
          />
        )}
      </section>
    </div>
  );
}
