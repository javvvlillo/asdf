-- DropIndex
DROP INDEX "Contribution_flowOrder_key";

-- DropIndex
DROP INDEX "Contribution_flowToken_idx";

-- DropIndex
DROP INDEX "WebhookEvent_flowToken_key";

-- AlterTable
ALTER TABLE "Contribution" DROP COLUMN "flowOrder",
DROP COLUMN "flowToken",
ADD COLUMN     "externalReference" TEXT NOT NULL,
ADD COLUMN     "mpPaymentId" TEXT;

-- AlterTable
ALTER TABLE "WebhookEvent" DROP COLUMN "flowToken",
ADD COLUMN     "mpPaymentId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_externalReference_key" ON "Contribution"("externalReference");

-- CreateIndex
CREATE INDEX "Contribution_mpPaymentId_idx" ON "Contribution"("mpPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_mpPaymentId_key" ON "WebhookEvent"("mpPaymentId");

