import Link from "next/link";

interface KpiCardProps {
  label: string;
  value: number | string;
  /** Optional accent color applied to the value. Defaults to gray-900. */
  valueColor?: "default" | "red" | "amber" | "green";
  /** If provided, the card renders as a Next.js Link. */
  href?: string;
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
  href,
}: KpiCardProps) {
  const inner = (
    <>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-medium mt-1 tabular-nums ${VALUE_COLOR[valueColor]}`}>
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block bg-white border border-gray-200 rounded p-5 hover:border-gray-400 transition-colors"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded p-5">{inner}</div>
  );
}
