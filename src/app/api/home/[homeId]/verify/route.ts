// app/api/home/[homeId]/verify/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashVerificationCode } from "@/lib/verification";

export async function POST(
  req: Request,
  { params }: { params: { homeId: string } }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Verification code is required." },
        { status: 400 }
      );
    }

    const homeId = params.homeId;
    const userId = session.user.id;

    // Ensure user owns this home
    const home = await prisma.home.findFirst({
      where: { id: homeId, ownerId: userId },
    });

    if (!home) {
      return NextResponse.json({ error: "Home not found" }, { status: 404 });
    }

    // Latest pending postcard verification
    const verification = await prisma.homeVerification.findFirst({
      where: {
        homeId,
        method: "POSTCARD",
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "No pending postcard verification found." },
        { status: 400 }
      );
    }

    // Expiration
    if (verification.expiresAt && verification.expiresAt < new Date()) {
      await prisma.homeVerification.update({
        where: { id: verification.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { error: "This verification code has expired. Request a new postcard." },
        { status: 400 }
      );
    }

    // Attempts
    if (verification.attempts >= verification.maxAttempts) {
      await prisma.homeVerification.update({
        where: { id: verification.id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json(
        {
          error:
            "Too many incorrect attempts. Please request a new postcard verification.",
        },
        { status: 400 }
      );
    }

    const inputHash = hashVerificationCode(code.trim());
    const isMatch = verification.codeHash === inputHash;

    if (!isMatch) {
      await prisma.homeVerification.update({
        where: { id: verification.id },
        data: {
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: "Incorrect verification code." },
        { status: 400 }
      );
    }

    // Success: complete verification + update home
    const now = new Date();

    const [_, updatedHome] = await prisma.$transaction([
      prisma.homeVerification.update({
        where: { id: verification.id },
        data: {
          status: "COMPLETED",
          completedAt: now,
          lastAttemptAt: now,
        },
      }),
      prisma.home.update({
        where: { id: homeId },
        data: {
          verificationStatus: "VERIFIED_BY_POSTCARD",
          verificationMethod: "POSTCARD",
          verifiedAt: now,
          verifiedByUserId: userId,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, home: updatedHome });
  } catch (err) {
    console.error("verify home error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}