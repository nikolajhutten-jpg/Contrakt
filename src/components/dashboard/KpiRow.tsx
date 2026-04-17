import KpiCard from "@/components/ui/KpiCard";
import type { DashboardKpis } from "@/lib/db/dashboard";

interface KpiRowProps {
  kpis: DashboardKpis;
}

export default function KpiRow({ kpis }: KpiRowProps) {
  return (
    <div className="grid grid-cols-2" style={{ gap: "10px" }}>
      <KpiCard
        label="All contracts"
        value={kpis.total}
        href="/contracts"
      />
      <KpiCard
        label="Action required"
        value={kpis.actionRequired}
        valueColor={kpis.actionRequired > 0 ? "red" : "default"}
        href="/action-required"
      />
    </div>
  );
}
