// app/api/stats/claim/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

    // Check if stats already exists
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
          { error: "You already have access to this stats", id: home.id },
          { status: 400 }
        );
      }

      // Check if stats has an owner
      const existingOwner = await prisma.homeAccess.findFirst({
        where: {
          homeId: home.id,
          role: "OWNER",
        },
      });

      if (existingOwner) {
        return NextResponse.json(
          { error: "This stats is already claimed by another user" },
          { status: 400 }
        );
      }

      // Grant access to existing stats
      await prisma.homeAccess.create({
        data: {
          homeId: home.id,
          userId,
          role: "OWNER"
        },
      });

      return NextResponse.json({ id: home.id });
    }

    // Create new stats
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
        role: "OWNER"
      },
    });

    return NextResponse.json({ id: home.id });
  } catch (error) {
    console.error("Error claiming stats:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to claim stats" },
      { status: 500 }
    );
  }
}