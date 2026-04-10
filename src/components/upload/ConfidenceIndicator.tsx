import type { ConfidenceLevel } from "@/types";

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel | null | undefined;
}

const CONFIG: Record<ConfidenceLevel, { color: string; label: string }> = {
  high: { color: "bg-green-500", label: "High confidence" },
  medium: { color: "bg-amber-400", label: "Medium confidence — review this field" },
  low: { color: "bg-gray-300", label: "Low confidence — please enter manually" },
};

export default function ConfidenceIndicator({ level }: ConfidenceIndicatorProps) {
  if (!level) return <span className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />;
  const { color, label } = CONFIG[level];
  return (
    <span
      title={label}
      className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`}
    />
  );
}
