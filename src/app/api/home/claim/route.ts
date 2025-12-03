// app/api/claim/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateNumericCode, hashVerificationCode } from "@/lib/verification";
import { sendVerificationPostcardViaLob } from "@/lib/postcard";

export const runtime = "nodejs";

const claimSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
});

function normalizeAddress(parts: { address: string; city: string; state: string; zip: string }): string {
  return `${parts.address}${parts.city}${parts.state}${parts.zip}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const data = claimSchema.parse(body);

    const normalizedAddress = normalizeAddress(data);

    // Check if home already exists
    let home = await prisma.home.findFirst({
      where: { normalizedAddress },
    });

    if (home) {
      // Check if user already has access
      const existingAccess = await prisma.homeAccess.findFirst({
        where: {
          homeId: home.id,
          userId,
        },
      });

      if (existingAccess) {
        return NextResponse.json(
          { error: "You already have access to this home", id: home.id },
          { status: 400 }
        );
      }

      // Check if home has an owner
      const existingOwnerAccess = await prisma.homeAccess.findFirst({
        where: {
          homeId: home.id,
          role: "OWNER",
        },
      });

      if (existingOwnerAccess) {
        return NextResponse.json(
          { error: "This home is already claimed by another user" },
          { status: 400 }
        );
      }

      // Grant access to existing home + mark ownerId
      await prisma.homeAccess.create({
        data: {
          homeId: home.id,
          userId,
          role: "OWNER",
        },
      });

      home = await prisma.home.update({
        where: { id: home.id },
        data: {
          ownerId: userId,
        },
      });

      // Create verification + send postcard (best-effort)
      const extras = await createPostcardVerificationForHome({ home, userId, userName: session.user.name });

      return NextResponse.json({ id: home.id, ...extras });
    }

    // Create new home
    home = await prisma.home.create({
      data: {
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        normalizedAddress,
        ownerId: userId,
      },
    });

    // Grant owner access
    await prisma.homeAccess.create({
      data: {
        homeId: home.id,
        userId,
        role: "OWNER",
      },
    });

    const extras = await createPostcardVerificationForHome({ home, userId, userName: session.user.name });

    return NextResponse.json({ id: home.id, ...extras });
  } catch (error) {
    console.error("Error claiming home:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to claim home" },
      { status: 500 }
    );
  }
}

async function createPostcardVerificationForHome({
  home,
  userId,
  userName,
}: {
  home: { id: string; address: string; addressLine2?: string | null; city: string; state: string; zip: string; country?: string | null };
  userId: string;
  userName?: string | null;
}) {
  try {
    const code = generateNumericCode(6);
    const codeHash = hashVerificationCode(code);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const verification = await prisma.homeVerification.create({
      data: {
        homeId: home.id,
        method: "POSTCARD",
        status: "PENDING",
        codeHash,
        expiresAt,
        createdByUserId: userId,
      },
    });

    const toAddress = {
      name: userName || "Current Resident",
      addressLine1: home.address,
      addressLine2: home.addressLine2 ?? null,
      city: home.city,
      state: home.state,
      postalCode: home.zip,
      country: home.country ?? "US",
    };

    const postcardResult = await sendVerificationPostcardViaLob({
      to: toAddress,
      home: { id: home.id, address: home.address },
      code,
    });

    return {
      verificationId: verification.id,
      verificationProviderId: postcardResult.providerId,
      verificationExpiresAt: expiresAt,
    };
  } catch (err) {
    console.error("Error creating postcard verification for home:", err);
    // don't fail the claim if postcard fails
    return {
      verificationWarning: "Home claimed, but postcard verification failed to start.",
    };
  }
}