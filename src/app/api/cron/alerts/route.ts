import { NextRequest, NextResponse } from "next/server";
import { checkAndFireAlerts } from "@/lib/services/alertScheduler";
import { updateContractStatuses } from "@/lib/services/statusUpdater";
import { env } from "@/env";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alertsFired = await checkAndFireAlerts();
    await updateContractStatuses();
    return NextResponse.json({
      alertsFired,
      statusesUpdated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/alerts] Job failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Job failed." }, { status: 500 });
  }
}
