/**
 * PENDING INVITATIONS COUNT API ROUTE
 *
 * Endpoint: /api/invitations/pending
 *
 * GET - Returns pending invitation count for the current user across all homes
 *
 * Works for homeowners - counts invitations across all homes they own
 *
 * Returns:
 * {
 *   total: 5,  // Total pending invitations across all homes
 * }
 *
 * Location: app/api/invitations/pending/route.ts
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all homes owned by this user
    const homes = await prisma.home.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const homeIds = homes.map((h) => h.id);

    // No homes = no invitations
    if (homeIds.length === 0) {
      return NextResponse.json({ total: 0 });
    }

    // Count pending invitations across all homes
    const totalPending = await prisma.invitation.count({
      where: {
        homeId: { in: homeIds },
        status: "PENDING",
      },
    });

    return NextResponse.json({ total: totalPending });
  } catch (error) {
    console.error("Error fetching pending invitations count:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending invitations count" },
      { status: 500 }
    );
  }
}