-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'GIFTED');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Registry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coupleNames" TEXT NOT NULL,
    "weddingDate" TIMESTAMP(3) NOT NULL,
    "welcomeMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "registryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "reservedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "message" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "flowToken" TEXT,
    "flowOrder" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "flowToken" TEXT NOT NULL,
    "payloadRaw" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Registry_slug_key" ON "Registry"("slug");

-- CreateIndex
CREATE INDEX "Item_registryId_status_idx" ON "Item"("registryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_flowOrder_key" ON "Contribution"("flowOrder");

-- CreateIndex
CREATE INDEX "Contribution_itemId_status_idx" ON "Contribution"("itemId", "status");

-- CreateIndex
CREATE INDEX "Contribution_flowToken_idx" ON "Contribution"("flowToken");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_flowToken_key" ON "WebhookEvent"("flowToken");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "Registry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
