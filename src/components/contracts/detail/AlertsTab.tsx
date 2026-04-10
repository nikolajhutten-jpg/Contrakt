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

  const channelList = alert.channels.join(" & ");
  const ref = REF_LABELS[alert.triggerReference] ?? alert.triggerReference;

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm text-gray-900">
          {alert.triggerValue} {alert.triggerUnit} before {ref}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{channelList}</p>
        {alert.sentAt && (
          <p className="text-xs text-green-600 mt-0.5">
            Sent{" "}
            {new Date(alert.sentAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>
      {canEdit && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors flex-shrink-0"
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
        <p className="text-sm text-gray-400 py-4">No alerts configured.</p>
      )}

      {alerts.length > 0 && (
        <div className="mb-2">
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
          className="mt-2 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
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
