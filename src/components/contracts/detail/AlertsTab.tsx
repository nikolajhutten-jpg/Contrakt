"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AddAlertForm from "@/components/contracts/detail/AddAlertForm";
import type { NotificationAlert } from "@/types";

interface AlertsTabProps {
  alerts: NotificationAlert[];
  contractId: string;
  canEdit: boolean;
}

const REF_LABELS: Record<string, string> = {
  renewal_notice_deadline: "renewal notice deadline",
  end_date: "end date",
};

function ChannelPill({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "20px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: 500,
        background: "rgba(0,0,0,0.06)",
        color: "rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
        textTransform: "capitalize",
      }}
    >
      {label}
    </span>
  );
}

function AlertRow({
  alert,
  contractId,
  canEdit,
}: {
  alert: NotificationAlert;
  contractId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [deleting, startDelete] = useTransition();

  function handleDelete() {
    startDelete(async () => {
      await fetch(`/api/contracts/${contractId}/alerts/${alert.id}`, {
        method: "DELETE",
      });
      router.refresh();
    });
  }

  const ref = REF_LABELS[alert.triggerReference] ?? alert.triggerReference;

  return (
    <div
      className="group"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "10px 0",
        borderBottom: "0.5px solid rgba(0,0,0,0.05)",
      }}
    >
      {/* Timing */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13px", color: "#171717" }}>
          {alert.triggerValue} {alert.triggerUnit} before {ref}
        </p>
        {alert.sentAt && (
          <p style={{ fontSize: "11px", color: "#1a7f4b", marginTop: "2px" }}>
            Sent{" "}
            {new Date(alert.sentAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Channel pills */}
      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
        {alert.channels.map((ch) => (
          <ChannelPill key={ch} label={ch} />
        ))}
      </div>

      {/* Remove — hover only */}
      {canEdit && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            fontSize: "12px",
            color: "rgba(0,0,0,0.35)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
            opacity: deleting ? 0.5 : undefined,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#c0392b";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.35)";
          }}
        >
          {deleting ? "Removing…" : "Remove"}
        </button>
      )}
    </div>
  );
}

export default function AlertsTab({
  alerts,
  contractId,
  canEdit,
}: AlertsTabProps) {
  const [adding, setAdding] = useState(false);

  return (
    <div>
      {alerts.length === 0 && !adding && (
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", padding: "16px 0" }}>
          No alerts configured.
        </p>
      )}

      {alerts.length > 0 && (
        <div>
          {alerts.map((a) => (
            <AlertRow
              key={a.id}
              alert={a}
              contractId={contractId}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {canEdit && !adding && (
        <button
          onClick={() => setAdding(true)}
          style={{
            marginTop: "12px",
            fontSize: "13px",
            color: "#1a7f4b",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          + Add alert
        </button>
      )}

      {adding && (
        <AddAlertForm contractId={contractId} onDone={() => setAdding(false)} />
      )}
    </div>
  );
}
