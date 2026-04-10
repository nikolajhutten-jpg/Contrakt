import { db } from "@/lib/db/client";
import type { Tenant } from "@/types";

export async function getTenantSettings(tenantId: string): Promise<Tenant | null> {
  return db.tenant.findFirst({ where: { id: tenantId } });
}

export interface UpdateTenantSettingsData {
  slackWebhookUrl?: string | null;
  name?: string;
}

export async function updateTenantSettings(
  tenantId: string,
  data: UpdateTenantSettingsData,
): Promise<Tenant> {
  return db.tenant.update({ where: { id: tenantId }, data });
}
