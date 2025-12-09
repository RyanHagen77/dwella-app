-- CreateEnum
CREATE TYPE "HomeVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED_BY_POSTCARD', 'VERIFIED_BY_VENDOR');

-- CreateEnum
CREATE TYPE "HomeVerificationMethod" AS ENUM ('POSTCARD', 'VENDOR');

-- CreateEnum
CREATE TYPE "VerificationRecordStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Home" ADD COLUMN     "verificationMethod" "HomeVerificationMethod",
ADD COLUMN     "verificationStatus" "HomeVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedByUserId" TEXT;

-- CreateTable
CREATE TABLE "HomeVerification" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "method" "HomeVerificationMethod" NOT NULL,
    "status" "VerificationRecordStatus" NOT NULL DEFAULT 'PENDING',
    "codeHash" TEXT,
    "vendorId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastAttemptAt" TIMESTAMP(3),

    CONSTRAINT "HomeVerification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Home" ADD CONSTRAINT "Home_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVerification" ADD CONSTRAINT "HomeVerification_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVerification" ADD CONSTRAINT "HomeVerification_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVerification" ADD CONSTRAINT "HomeVerification_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
