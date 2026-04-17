import Link from "next/link";

interface KpiCardProps {
  label: string;
  value: number | string;
  /** Optional accent color applied to the value. Defaults to default. */
  valueColor?: "default" | "red" | "amber" | "green";
  /** If provided, the card renders as a Next.js Link. */
  href?: string;
}

const VALUE_COLOR: Record<NonNullable<KpiCardProps["valueColor"]>, string> = {
  default: "#171717",
  red: "#c0392b",
  amber: "#b45309",
  green: "#1a7f4b",
};

const CARD_STYLE: React.CSSProperties = {
  background: "#ffffff",
  border: "0.5px solid rgba(0,0,0,0.08)",
  borderRadius: "12px",
  padding: "14px 16px",
};

export default function KpiCard({
  label,
  value,
  valueColor = "default",
  href,
}: KpiCardProps) {
  const inner = (
    <>
      <p style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", marginBottom: "4px" }}>
        {label}
      </p>
      <p
        style={{
          fontSize: "28px",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          color: VALUE_COLOR[valueColor],
        }}
      >
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block transition-colors"
        style={{
          ...CARD_STYLE,
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
        }}
      >
        {inner}
      </Link>
    );
  }

  return <div style={CARD_STYLE}>{inner}</div>;
}
