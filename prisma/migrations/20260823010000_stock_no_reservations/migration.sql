-- AlterEnum
BEGIN;
CREATE TYPE "ContributionStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "Contribution" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Contribution" ALTER COLUMN "status" TYPE "ContributionStatus_new" USING ("status"::text::"ContributionStatus_new");
ALTER TYPE "ContributionStatus" RENAME TO "ContributionStatus_old";
ALTER TYPE "ContributionStatus_new" RENAME TO "ContributionStatus";
DROP TYPE "ContributionStatus_old";
ALTER TABLE "Contribution" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "Item_registryId_status_idx";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "reservedUntil",
DROP COLUMN "status",
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 1;

-- DropEnum
DROP TYPE "ItemStatus";

-- CreateIndex
CREATE INDEX "Item_registryId_idx" ON "Item"("registryId");

