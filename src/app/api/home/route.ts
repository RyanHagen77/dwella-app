// app/api/home/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateNumericCode, hashVerificationCode } from "@/lib/verification";
import { sendVerificationPostcardViaLob } from "@/lib/postcard";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Adjust to your payload shape
    const {
      address,
      addressLine2,
      city,
      state,
      zip,
      postalCode,
      country = "US",
    } = body;

    const finalPostal = postalCode ?? zip;

    if (!address || !city || !state || !finalPostal) {
      return NextResponse.json(
        { error: "Address is incomplete." },
        { status: 400 }
      );
    }

    const home = await prisma.home.create({
      data: {
        ownerId: userId,
        address,
        addressLine2,
        city,
        state,
        zip: zip ?? finalPostal,
        postalCode: finalPostal,
        country,
        // verificationStatus defaults to UNVERIFIED
      },
    });

    // Create verification & send postcard
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

      return NextResponse.json(
        {
          ok: true,
          home,
          verificationId: verification.id,
          providerId: postcardResult.providerId,
        },
        { status: 201 }
      );
    } catch (err) {
      console.error("Error sending postcard after home creation:", err);

      await prisma.homeVerification.update({
        where: { id: verification.id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json(
        {
          ok: true,
          home,
          warning: "Home created, but postcard failed to send. Try again.",
        },
        { status: 201 }
      );
    }
  } catch (err) {
    console.error("Create home error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}