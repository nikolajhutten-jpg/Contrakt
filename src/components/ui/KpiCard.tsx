interface KpiCardProps {
  label: string;
  value: number | string;
  /** Optional accent color applied to the value. Defaults to gray-900. */
  valueColor?: "default" | "red" | "amber" | "green";
}

const VALUE_COLOR: Record<NonNullable<KpiCardProps["valueColor"]>, string> = {
  default: "text-gray-900",
  red: "text-red-600",
  amber: "text-amber-600",
  green: "text-green-600",
};

export default function KpiCard({
  label,
  value,
  valueColor = "default",
}: KpiCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-medium mt-1 tabular-nums ${VALUE_COLOR[valueColor]}`}>
        {value}
      </p>
    </div>
  );
}
