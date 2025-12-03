// app/api/home/[homeId]/send-postcard/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateNumericCode, hashVerificationCode } from "@/lib/verification";
import { sendVerificationPostcardViaLob } from "@/lib/postcard";

const POSTCARD_MIN_INTERVAL_HOURS = 24; // basic rate limit

export async function POST(
  req: Request,
  { params }: { params: { homeId: string } }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const homeId = params.homeId;
    const userId = session.user.id;

    // Ensure user owns this home (by ownerId)
    const home = await prisma.home.findFirst({
      where: { id: homeId, ownerId: userId },
    });

    if (!home) {
      return NextResponse.json({ error: "Home not found" }, { status: 404 });
    }

    // Rate limit: prevent spamming postcards
    const lastPostcard = await prisma.homeVerification.findFirst({
      where: {
        homeId,
        method: "POSTCARD",
      },
      orderBy: { createdAt: "desc" },
    });

    if (lastPostcard) {
      const diffMs = Date.now() - lastPostcard.createdAt.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < POSTCARD_MIN_INTERVAL_HOURS) {
        return NextResponse.json(
          {
            error: "Too many postcard requests. Please wait before resending.",
          },
          { status: 429 }
        );
      }
    }

    // Generate and hash code
    const code = generateNumericCode(6);
    const codeHash = hashVerificationCode(code);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiration

    const verification = await prisma.homeVerification.create({
      data: {
        homeId,
        method: "POSTCARD",
        status: "PENDING",
        codeHash,
        expiresAt,
        createdByUserId: userId,
      },
    });

    const toAddress = {
      name: session.user.name || "Current Resident",
      addressLine1: home.address,
      addressLine2: home.addressLine2 ?? null,
      city: home.city,
      state: home.state,
      postalCode: home.postalCode ?? home.zip,
      country: home.country ?? "US",
    };

    try {
      const postcardResult = await sendVerificationPostcardViaLob({
        to: toAddress,
        home,
        code,
      });

      return NextResponse.json({
        ok: true,
        verificationId: verification.id,
        providerId: postcardResult.providerId,
        expiresAt,
      });
    } catch (err) {
      // mark verification as cancelled if sending failed
      await prisma.homeVerification.update({
        where: { id: verification.id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json(
        { error: "Failed to send postcard. Please try again later." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("send-postcard error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}