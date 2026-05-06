import { ContractStatus } from "@/types";

/** All visual status variants — includes the display-only "renewal_due" state. */
export type StatusVariant = ContractStatus | "renewal_due";

interface Config {
  background: string;
  color: string;
  label: string;
}

const CONFIG: Record<StatusVariant, Config> = {
  [ContractStatus.Active]: {
    background: "#e6f4ec",
    color: "#1a1a1a",
    label: "Active",
  },
  [ContractStatus.ActionRequired]: {
    background: "#fdecea",
    color: "#c0392b",
    label: "Action required",
  },
  [ContractStatus.Expired]: {
    background: "rgba(0,0,0,0.06)",
    color: "rgba(0,0,0,0.45)",
    label: "Expired",
  },
  [ContractStatus.AutoRenewed]: {
    background: "#e8f0fe",
    color: "#1a56db",
    label: "Auto-renewed",
  },
  renewal_due: {
    background: "#fff3e0",
    color: "#b45309",
    label: "Action required",
  },
};

interface StatusBadgeProps {
  status: StatusVariant;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { background, color, label } = CONFIG[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "20px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: 500,
        background,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
