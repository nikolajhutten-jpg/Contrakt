-- AddColumn: contract_name (required, no default going forward)
-- Existing rows get an empty string as a one-time backfill; the default is
-- dropped immediately so future inserts must supply the value explicitly.
ALTER TABLE "contracts" ADD COLUMN "contract_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "contracts" ALTER COLUMN "contract_name" DROP DEFAULT;
