import KpiCard from "@/components/ui/KpiCard";
import type { DashboardKpis } from "@/lib/db/dashboard";

interface KpiRowProps {
  kpis: DashboardKpis;
}

export default function KpiRow({ kpis }: KpiRowProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <KpiCard label="Total contracts" value={kpis.total} />
      <KpiCard label="Active" value={kpis.active} valueColor="green" />
      <KpiCard
        label="Action required"
        value={kpis.actionRequired}
        valueColor={kpis.actionRequired > 0 ? "red" : "default"}
      />
      <KpiCard
        label="Renewals due"
        value={kpis.renewalsDue}
        valueColor={kpis.renewalsDue > 0 ? "amber" : "default"}
      />
    </div>
  );
}
