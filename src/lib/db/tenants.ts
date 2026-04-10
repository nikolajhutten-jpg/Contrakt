import { db } from "@/lib/db/client";
import type { Tenant } from "@/types";

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  const row = await db.tenant.findFirst({
    where: { id: tenantId },
  });
  return row;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const row = await db.tenant.findUnique({
    where: { slug },
  });
  return row;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  gcsBucket: string;
  trialEndsAt?: Date;
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  return db.tenant.create({
    data: {
      name: input.name,
      slug: input.slug,
      gcsBucket: input.gcsBucket,
      trialEndsAt: input.trialEndsAt,
    },
  });
}
