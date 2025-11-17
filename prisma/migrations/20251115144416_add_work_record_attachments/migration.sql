-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "workRecordId" TEXT;

-- CreateIndex
CREATE INDEX "Attachment_workRecordId_idx" ON "Attachment"("workRecordId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_workRecordId_fkey" FOREIGN KEY ("workRecordId") REFERENCES "WorkRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
