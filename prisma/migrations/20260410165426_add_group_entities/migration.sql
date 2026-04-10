-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "group_entity_id" TEXT,
ALTER COLUMN "internal_group_entity" DROP NOT NULL;

-- CreateTable
CREATE TABLE "group_entities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_entities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_group_entity_id_fkey" FOREIGN KEY ("group_entity_id") REFERENCES "group_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_entities" ADD CONSTRAINT "group_entities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
