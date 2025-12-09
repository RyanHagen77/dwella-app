/*
  Warnings:

  - You are about to drop the column `workRecordId` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `workRecordId` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the `WorkRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ContractorReminderStatus" AS ENUM ('PENDING', 'DONE');

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_workRecordId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_workRecordId_fkey";

-- DropForeignKey
ALTER TABLE "WorkRecord" DROP CONSTRAINT "WorkRecord_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "WorkRecord" DROP CONSTRAINT "WorkRecord_contractorId_fkey";

-- DropForeignKey
ALTER TABLE "WorkRecord" DROP CONSTRAINT "WorkRecord_finalRecordId_fkey";

-- DropForeignKey
ALTER TABLE "WorkRecord" DROP CONSTRAINT "WorkRecord_homeId_fkey";

-- DropForeignKey
ALTER TABLE "WorkRecord" DROP CONSTRAINT "WorkRecord_submissionId_fkey";

-- DropIndex
DROP INDEX "Attachment_workRecordId_idx";

-- DropIndex
DROP INDEX "Reminder_createdBy_idx";

-- DropIndex
DROP INDEX "Reminder_homeId_dueAt_createdBy_idx";

-- DropIndex
DROP INDEX "Reminder_homeId_dueAt_idx";

-- DropIndex
DROP INDEX "ServiceRequest_workRecordId_key";

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "workRecordId",
ADD COLUMN     "serviceRecordId" TEXT;

-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "completedAt";

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "workRecordId";

-- DropTable
DROP TABLE "WorkRecord";

-- CreateTable
CREATE TABLE "ContractorReminder" (
    "id" TEXT NOT NULL,
    "proId" TEXT NOT NULL,
    "serviceRecordId" TEXT,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "note" TEXT,
    "status" "ContractorReminderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorReminderAttachment" (
    "id" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,

    CONSTRAINT "ContractorReminderAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRecord" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT,
    "submissionId" TEXT,
    "homeId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "addressSnapshot" JSONB,
    "serviceType" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(12,2),
    "invoiceUrl" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "warrantyIncluded" BOOLEAN NOT NULL DEFAULT false,
    "warrantyLength" TEXT,
    "warrantyDetails" TEXT,
    "status" "WorkSubmissionStatus" NOT NULL DEFAULT 'DOCUMENTED',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "finalRecordId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRecord_serviceRequestId_key" ON "ServiceRecord"("serviceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRecord_submissionId_key" ON "ServiceRecord"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRecord_finalRecordId_key" ON "ServiceRecord"("finalRecordId");

-- CreateIndex
CREATE INDEX "ServiceRecord_homeId_idx" ON "ServiceRecord"("homeId");

-- CreateIndex
CREATE INDEX "ServiceRecord_contractorId_idx" ON "ServiceRecord"("contractorId");

-- CreateIndex
CREATE INDEX "ServiceRecord_status_idx" ON "ServiceRecord"("status");

-- CreateIndex
CREATE INDEX "ServiceRecord_submissionId_idx" ON "ServiceRecord"("submissionId");

-- CreateIndex
CREATE INDEX "ServiceRecord_createdAt_idx" ON "ServiceRecord"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceRecord_isVerified_idx" ON "ServiceRecord"("isVerified");

-- CreateIndex
CREATE INDEX "Attachment_serviceRecordId_idx" ON "Attachment"("serviceRecordId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "ServiceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorReminder" ADD CONSTRAINT "ContractorReminder_proId_fkey" FOREIGN KEY ("proId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorReminder" ADD CONSTRAINT "ContractorReminder_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "ServiceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorReminderAttachment" ADD CONSTRAINT "ContractorReminderAttachment_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "ContractorReminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorReminderAttachment" ADD CONSTRAINT "ContractorReminderAttachment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WorkSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_finalRecordId_fkey" FOREIGN KEY ("finalRecordId") REFERENCES "Record"("id") ON DELETE SET NULL ON UPDATE CASCADE;
