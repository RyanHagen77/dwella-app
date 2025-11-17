-- CreateEnum
CREATE TYPE "EstablishedVia" AS ENUM ('VERIFIED_WORK', 'INVITATION', 'MANUAL');

-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('HOMEOWNER_TO_CONTRACTOR', 'CONTRACTOR_TO_HOMEOWNER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkRequestStatus" ADD VALUE 'DOCUMENTED_UNVERIFIED';
ALTER TYPE "WorkRequestStatus" ADD VALUE 'DISPUTED';

-- AlterTable
ALTER TABLE "Connection" ADD COLUMN     "establishedVia" "EstablishedVia",
ADD COLUMN     "lastWorkDate" TIMESTAMP(3),
ADD COLUMN     "sourceRecordId" TEXT,
ADD COLUMN     "totalSpent" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "verifiedWorkCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Home" ADD COLUMN     "normalizedAddress" TEXT;

-- AlterTable
ALTER TABLE "WorkInvitation" ADD COLUMN     "invitationType" "InvitationType" NOT NULL DEFAULT 'HOMEOWNER_TO_CONTRACTOR';

-- AlterTable
ALTER TABLE "WorkRecord" ADD COLUMN     "addressSnapshot" JSONB,
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "claimedBy" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT,
ALTER COLUMN "invitationId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "WorkRecord_isVerified_idx" ON "WorkRecord"("isVerified");
