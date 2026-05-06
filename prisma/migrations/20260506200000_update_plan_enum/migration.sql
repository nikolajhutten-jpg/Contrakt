-- Finish the TenantPlan enum rename.
-- Prior partial runs already:
--   • Created the new TenantPlan enum ('free','starter','team','business')
--   • Migrated row values (trial→free, growth→team, enterprise→business)
--   • Dropped the column default
-- TenantPlan_old ('trial','starter','growth','enterprise',…) is the leftover.
-- This migration completes the remaining steps.

-- Step 1: switch the column to the new enum type
ALTER TABLE "tenants"
  ALTER COLUMN "plan" TYPE "TenantPlan"
  USING "plan"::text::"TenantPlan";

-- Step 2: remove the leftover old type
DROP TYPE "TenantPlan_old";

-- Step 3: restore the default
ALTER TABLE "tenants" ALTER COLUMN "plan" SET DEFAULT 'free'::"TenantPlan";
