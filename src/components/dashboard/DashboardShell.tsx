"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KpiRow from "@/components/dashboard/KpiRow";
import ContractTable from "@/components/dashboard/ContractTable";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import type { DashboardKpis, OnboardingState } from "@/lib/db/dashboard";
import type { ContractSummary } from "@/types";

const CHECKLIST_DISMISSED_KEY = "contrakt_onboarding_dismissed";

interface ChecklistItemProps {
  done: boolean;
  label: string;
}

function ChecklistItem({ done, label }: ChecklistItemProps) {
  return (
    <li className="flex items-center gap-2" style={{ fontSize: "13px" }}>
      <span
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: done ? "#1a7f4b" : "rgba(0,0,0,0.08)",
        }}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M8.5 2.5 4 7 1.5 4.5"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span style={{ color: done ? "rgba(0,0,0,0.35)" : "#171717", textDecoration: done ? "line-through" : "none" }}>
        {label}
      </span>
    </li>
  );
}

interface DashboardShellProps {
  kpis: DashboardKpis;
  activeContracts: ContractSummary[];
  upcomingRenewals: ContractSummary[];
  onboarding: OnboardingState;
  isAdmin: boolean;
}

export default function DashboardShell({
  kpis,
  activeContracts,
  upcomingRenewals,
  onboarding,
  isAdmin,
}: DashboardShellProps) {
  const router = useRouter();
  const [checklistDismissed, setChecklistDismissed] = useState(true);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setChecklistDismissed(
      localStorage.getItem(CHECKLIST_DISMISSED_KEY) === "true",
    );
    setTodayLabel(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
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
    <div style={{ padding: "28px 32px", maxWidth: "1280px" }}>
      {/* Page header */}
      <div className="flex items-start justify-between" style={{ marginBottom: "24px" }}>
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "#171717",
              lineHeight: 1.2,
            }}
          >
            Dashboard
          </h1>
          {todayLabel && (
            <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginTop: "3px" }}>
              {todayLabel}
            </p>
          )}
        </div>
        <Link href="/contracts/new">
          <Button variant="secondary" size="sm">Add contract</Button>
        </Link>
      </div>

      {/* Onboarding checklist */}
      {showChecklist && (
        <div
          style={{
            marginBottom: "24px",
            background: "#ffffff",
            border: "0.5px solid rgba(0,0,0,0.08)",
            borderRadius: "12px",
            padding: "16px 20px",
          }}
        >
          <div className="flex items-start justify-between" style={{ marginBottom: "12px" }}>
            <div>
              <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#171717" }}>
                Get started with Contrakt
              </h2>
              <p style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", marginTop: "2px" }}>
                Complete these steps to finish setting up your workspace.
              </p>
            </div>
            <button
              onClick={dismissChecklist}
              style={{
                fontSize: "12px",
                color: "rgba(0,0,0,0.35)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Dismiss
            </button>
          </div>
          <ul style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <ChecklistItem done label="Account created" />
            <ChecklistItem done={onboarding.departmentsAdded} label="Add a department" />
            <ChecklistItem done={onboarding.firstUserInvited} label="Invite a team member" />
            <ChecklistItem done={onboarding.slackConnected} label="Connect Slack" />
            <ChecklistItem done={onboarding.firstContractUploaded} label="Upload your first contract" />
          </ul>
        </div>
      )}

      {/* KPI row */}
      <div style={{ marginBottom: "24px" }}>
        <KpiRow kpis={kpis} />
      </div>

      {/* Recent contracts section */}
      <section style={{ marginBottom: "24px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#171717",
            }}
          >
            Recent contracts
          </span>
          <Link
            href="/contracts"
            style={{ fontSize: "13px", color: "#1a7f4b", textDecoration: "none" }}
          >
            View all →
          </Link>
        </div>
        {activeContracts.length === 0 ? (
          <EmptyState
            heading="No active contracts"
            subtext="Your active contracts will appear here."
            actionLabel="Upload a contract"
            onAction={() => router.push("/contracts/new")}
          />
        ) : (
          <ContractTable contracts={activeContracts} showFilter={false} />
        )}
      </section>

      {/* Action required section */}
      <section>
        <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#171717",
            }}
          >
            Action required
          </span>
          <Link
            href="/action-required"
            style={{ fontSize: "13px", color: "#1a7f4b", textDecoration: "none" }}
          >
            View all →
          </Link>
        </div>
        {upcomingRenewals.length === 0 ? (
          <EmptyState
            heading="No action required"
            subtext="Contracts with renewal notice deadlines in the next 2 months will appear here."
            actionLabel="View all contracts"
            onAction={() => router.push("/contracts")}
          />
        ) : (
          <ContractTable contracts={upcomingRenewals} showFilter={false} />
        )}
      </section>
    </div>
  );
}
