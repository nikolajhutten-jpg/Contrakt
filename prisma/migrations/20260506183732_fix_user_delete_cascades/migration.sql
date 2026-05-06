-- DropForeignKey
ALTER TABLE "contract_owners" DROP CONSTRAINT "contract_owners_user_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploaded_by_fkey";

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "uploaded_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "contract_owners" ADD CONSTRAINT "contract_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
