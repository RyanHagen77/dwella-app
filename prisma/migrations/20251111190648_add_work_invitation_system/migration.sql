-- CreateEnum
CREATE TYPE "WorkRequestStatus" AS ENUM ('PENDING_ACCEPTANCE', 'READY_TO_DOCUMENT', 'DOCUMENTED', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "WorkInvitation" (
    "id" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "homeAddress" TEXT NOT NULL,
    "homeCity" TEXT,
    "homeState" TEXT,
    "homeZip" TEXT,
    "homeId" TEXT,
    "workType" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "contractorId" TEXT NOT NULL,
    "homeownerId" TEXT,
    "status" "WorkRequestStatus" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "WorkInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkRecord" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(12,2),
    "invoiceUrl" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "warrantyIncluded" BOOLEAN NOT NULL DEFAULT false,
    "warrantyLength" TEXT,
    "warrantyDetails" TEXT,
    "status" "WorkRequestStatus" NOT NULL DEFAULT 'DOCUMENTED',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "finalRecordId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkInvitation_contractorId_idx" ON "WorkInvitation"("contractorId");

-- CreateIndex
CREATE INDEX "WorkInvitation_homeownerId_idx" ON "WorkInvitation"("homeownerId");

-- CreateIndex
CREATE INDEX "WorkInvitation_homeId_idx" ON "WorkInvitation"("homeId");

-- CreateIndex
CREATE INDEX "WorkInvitation_status_idx" ON "WorkInvitation"("status");

-- CreateIndex
CREATE INDEX "WorkInvitation_createdAt_idx" ON "WorkInvitation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkRecord_invitationId_key" ON "WorkRecord"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkRecord_finalRecordId_key" ON "WorkRecord"("finalRecordId");

-- CreateIndex
CREATE INDEX "WorkRecord_homeId_idx" ON "WorkRecord"("homeId");

-- CreateIndex
CREATE INDEX "WorkRecord_contractorId_idx" ON "WorkRecord"("contractorId");

-- CreateIndex
CREATE INDEX "WorkRecord_status_idx" ON "WorkRecord"("status");

-- CreateIndex
CREATE INDEX "WorkRecord_invitationId_idx" ON "WorkRecord"("invitationId");

-- CreateIndex
CREATE INDEX "WorkRecord_createdAt_idx" ON "WorkRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkInvitation" ADD CONSTRAINT "WorkInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkInvitation" ADD CONSTRAINT "WorkInvitation_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkInvitation" ADD CONSTRAINT "WorkInvitation_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkInvitation" ADD CONSTRAINT "WorkInvitation_homeownerId_fkey" FOREIGN KEY ("homeownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecord" ADD CONSTRAINT "WorkRecord_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "WorkInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecord" ADD CONSTRAINT "WorkRecord_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecord" ADD CONSTRAINT "WorkRecord_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecord" ADD CONSTRAINT "WorkRecord_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecord" ADD CONSTRAINT "WorkRecord_finalRecordId_fkey" FOREIGN KEY ("finalRecordId") REFERENCES "Record"("id") ON DELETE SET NULL ON UPDATE CASCADE;
