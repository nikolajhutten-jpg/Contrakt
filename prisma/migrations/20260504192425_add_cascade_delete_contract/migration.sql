-- DropForeignKey
ALTER TABLE "contract_owners" DROP CONSTRAINT "contract_owners_contract_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_contract_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_alerts" DROP CONSTRAINT "notification_alerts_contract_id_fkey";

-- AddForeignKey
ALTER TABLE "contract_owners" ADD CONSTRAINT "contract_owners_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_alerts" ADD CONSTRAINT "notification_alerts_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "users_auth0_id_key" RENAME TO "users_clerk_id_key";
