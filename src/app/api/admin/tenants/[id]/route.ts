import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { updateTenant } from "@/lib/db/tenants";
import { env } from "@/env";
import { TenantPlan, TenantPlanStatus } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

async function verifySuperadmin(): Promise<boolean> {
  const user = await currentUser();
  const email = user?.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;
  return email === env.SUPERADMIN_EMAIL;
}

const VALID_PLANS = Object.values(TenantPlan) as string[];
const VALID_STATUSES = Object.values(TenantPlanStatus) as string[];

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  if (!(await verifySuperadmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;

  const update: Partial<Pick<{ plan: TenantPlan; planStatus: TenantPlanStatus }, "plan" | "planStatus">> = {};

  if (body.plan !== undefined) {
    if (typeof body.plan !== "string" || !VALID_PLANS.includes(body.plan)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }
    update.plan = body.plan as TenantPlan;
  }

  if (body.planStatus !== undefined) {
    if (typeof body.planStatus !== "string" || !VALID_STATUSES.includes(body.planStatus)) {
      return NextResponse.json({ error: "Invalid planStatus." }, { status: 400 });
    }
    update.planStatus = body.planStatus as TenantPlanStatus;
  }

  try {
    const tenant = await updateTenant(id, update);
    return NextResponse.json({ data: tenant });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }
    console.error("[admin/tenants] updateTenant failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
