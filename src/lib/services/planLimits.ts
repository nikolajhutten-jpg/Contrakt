import { db } from "@/lib/db/client";
import type { TenantPlan, PlanUsage } from "@/types";

export type { PlanUsage };

// ─── Limits (§15.2) ───────────────────────────────────────────────────────────
// Starter and Trial share the same limits; Growth and Enterprise are unlimited.

const UNLIMITED = -1; // sentinel for Growth/Enterprise

const LIMITS: Record<TenantPlan, { contracts: number; users: number; extractions: number }> = {
  trial:      { contracts: 50,        users: 5,        extractions: 20 },
  starter:    { contracts: 50,        users: 5,        extractions: 20 },
  growth:     { contracts: UNLIMITED, users: UNLIMITED, extractions: UNLIMITED },
  enterprise: { contracts: UNLIMITED, users: UNLIMITED, extractions: UNLIMITED },
};

/** Returns current usage counts for a tenant. Used by the billing UI. */
export async function getPlanUsage(tenantId: string): Promise<PlanUsage> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [contracts, users, extractionsThisMonth] = await Promise.all([
    db.contract.count({ where: { tenantId } }),
    db.user.count({ where: { tenantId } }),
    db.extractionResult.count({
      where: { tenantId, createdAt: { gte: monthStart } },
    }),
  ]);
  return { contracts, users, extractionsThisMonth };
}

export interface LimitCheck {
  allowed: boolean;
  message?: string;
}

/**
 * Checks whether the tenant can create another contract (§15.6).
 * Call from POST /api/contracts before creating the record.
 */
export async function checkContractLimit(
  tenantId: string,
  plan: TenantPlan,
): Promise<LimitCheck> {
  const limit = LIMITS[plan].contracts;
  if (limit === UNLIMITED) return { allowed: true };
  const count = await db.contract.count({ where: { tenantId } });
  if (count >= limit) {
    return {
      allowed: false,
      message: `Contract limit reached (${limit}). Upgrade to Growth for unlimited contracts.`,
    };
  }
  return { allowed: true };
}

/**
 * Checks whether the tenant can invite another user (§15.6).
 * Call from POST /api/users/invite before creating the record.
 */
export async function checkUserLimit(
  tenantId: string,
  plan: TenantPlan,
): Promise<LimitCheck> {
  const limit = LIMITS[plan].users;
  if (limit === UNLIMITED) return { allowed: true };
  const count = await db.user.count({ where: { tenantId } });
  if (count >= limit) {
    return {
      allowed: false,
      message: `User limit reached (${limit}). Upgrade to Growth for unlimited users.`,
    };
  }
  return { allowed: true };
}

/**
 * Checks whether the tenant can run another AI extraction this month (§15.6).
 * Call from POST /api/upload before triggering the extraction pipeline.
 */
export async function checkExtractionLimit(
  tenantId: string,
  plan: TenantPlan,
): Promise<LimitCheck> {
  const limit = LIMITS[plan].extractions;
  if (limit === UNLIMITED) return { allowed: true };
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const count = await db.extractionResult.count({
    where: { tenantId, createdAt: { gte: monthStart } },
  });
  if (count >= limit) {
    return {
      allowed: false,
      message: `AI extraction limit reached (${limit}/month). Upgrade to Growth for unlimited extractions.`,
    };
  }
  return { allowed: true };
}
