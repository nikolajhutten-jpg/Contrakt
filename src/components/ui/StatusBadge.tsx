import { ContractStatus } from "@/types";

/** All visual status variants — includes the display-only "renewal_due" state. */
export type StatusVariant = ContractStatus | "renewal_due";

interface Config {
  dot: string;
  pill: string;
  label: string;
}

const CONFIG: Record<StatusVariant, Config> = {
  [ContractStatus.Active]: {
    dot: "bg-green-500",
    pill: "bg-green-50 text-green-700",
    label: "Active",
  },
  [ContractStatus.ActionRequired]: {
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-700",
    label: "Action required",
  },
  [ContractStatus.Expired]: {
    dot: "bg-gray-400",
    pill: "bg-gray-100 text-gray-600",
    label: "Expired",
  },
  [ContractStatus.AutoRenewed]: {
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700",
    label: "Auto-renewed",
  },
  renewal_due: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700",
    label: "Renewal due",
  },
};

interface StatusBadgeProps {
  status: StatusVariant;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { dot, pill, label } = CONFIG[status];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pill}`}
      >
        {label}
      </span>
    </span>
  );
}
