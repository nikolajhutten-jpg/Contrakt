import { NextRequest, NextResponse } from "next/server";
import { checkAndFireAlerts } from "@/lib/services/alertScheduler";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Vercel cron jobs send Authorization: Bearer <CRON_SECRET> automatically.
  // SCHEDULER_SECRET is accepted as an alias for manual / local invocation.
  const secret = process.env.CRON_SECRET ?? process.env.SCHEDULER_SECRET;
  const auth = req.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fired = await checkAndFireAlerts();
  return NextResponse.json({ fired });
}
