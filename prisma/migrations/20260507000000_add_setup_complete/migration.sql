-- AlterTable
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "setup_complete" BOOLEAN NOT NULL DEFAULT false;
