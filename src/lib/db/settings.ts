import { db } from "@/lib/db/client";
import type { Tenant, TenantPlan } from "@/types";

export async function getTenantSettings(tenantId: string): Promise<Tenant | null> {
  return db.tenant.findFirst({ where: { id: tenantId } });
}

export interface UpdateTenantSettingsData {
  slackWebhookUrl?: string | null;
  name?: string;
  plan?: TenantPlan;
  setupComplete?: boolean;
}

export async function updateTenantSettings(
  tenantId: string,
  data: UpdateTenantSettingsData,
): Promise<Tenant> {
  return db.tenant.update({ where: { id: tenantId }, data });
}
