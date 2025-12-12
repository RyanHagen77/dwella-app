-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- AlterTable
ALTER TABLE "Warranty" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "acceptedBy" TEXT,
ADD COLUMN     "serviceRecordId" TEXT,
ADD COLUMN     "status" "WarrantyStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Warranty_serviceRecordId_idx" ON "Warranty"("serviceRecordId");

-- CreateIndex
CREATE INDEX "Warranty_status_idx" ON "Warranty"("status");

-- CreateIndex
CREATE INDEX "Warranty_acceptedBy_idx" ON "Warranty"("acceptedBy");

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "ServiceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
