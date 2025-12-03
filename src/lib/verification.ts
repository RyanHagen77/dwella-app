// lib/verification.ts
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const VERIFICATION_SECRET = process.env.VERIFICATION_CODE_SECRET || "fallback-secret";

// Generate a 6–8 digit numeric code
export function generateNumericCode(length: number = 6): string {
  const len = Math.min(Math.max(length, 6), 8);
  let code = "";
  while (code.length < len) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

// Hash the code with a secret so we never store the raw code
export function hashVerificationCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(`${code}:${VERIFICATION_SECRET}`)
    .digest("hex");
}

// Mark a home as verified by vendor (call this from your contractor invite flow)
export async function verifyHomeByVendor(options: {
  homeId: string;
  vendorUserId: string;
  homeownerUserId?: string; // optional; who gets credit
}) {
  const { homeId, vendorUserId, homeownerUserId } = options;

  const now = new Date();

  // create a completed verification record with method=VENDOR
  await prisma.homeVerification.create({
    data: {
      homeId,
      method: "VENDOR",
      status: "COMPLETED",
      vendorId: vendorUserId,
      createdByUserId: homeownerUserId ?? vendorUserId,
      codeHash: null,
      completedAt: now,
    },
  });

  // update home
  const home = await prisma.home.update({
    where: { id: homeId },
    data: {
      verificationStatus: "VERIFIED_BY_VENDOR",
      verificationMethod: "VENDOR",
      verifiedAt: now,
      verifiedByUserId: homeownerUserId ?? vendorUserId,
    },
  });

  return home;
}