-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Home" ADD COLUMN     "previousOwnerId" TEXT,
ADD COLUMN     "transferredAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "HomeTransfer" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "message" TEXT,
    "notifyContractors" BOOLEAN NOT NULL DEFAULT true,
    "transferMessages" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "HomeTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeTransfer_token_key" ON "HomeTransfer"("token");

-- CreateIndex
CREATE INDEX "HomeTransfer_homeId_idx" ON "HomeTransfer"("homeId");

-- CreateIndex
CREATE INDEX "HomeTransfer_fromUserId_idx" ON "HomeTransfer"("fromUserId");

-- CreateIndex
CREATE INDEX "HomeTransfer_toUserId_idx" ON "HomeTransfer"("toUserId");

-- CreateIndex
CREATE INDEX "HomeTransfer_recipientEmail_idx" ON "HomeTransfer"("recipientEmail");

-- CreateIndex
CREATE INDEX "HomeTransfer_token_idx" ON "HomeTransfer"("token");

-- CreateIndex
CREATE INDEX "HomeTransfer_status_idx" ON "HomeTransfer"("status");

-- CreateIndex
CREATE INDEX "HomeTransfer_expiresAt_idx" ON "HomeTransfer"("expiresAt");

-- AddForeignKey
ALTER TABLE "Home" ADD CONSTRAINT "Home_previousOwnerId_fkey" FOREIGN KEY ("previousOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeTransfer" ADD CONSTRAINT "HomeTransfer_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeTransfer" ADD CONSTRAINT "HomeTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeTransfer" ADD CONSTRAINT "HomeTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
