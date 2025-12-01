/**
 * PENDING INVITATIONS COUNT API ROUTE
 *
 * Endpoint: /api/invitations/pending
 *
 * GET - Returns pending invitation count for the current user
 *
 * Works for:
 * - Homeowners: Counts invitations across all stats they own
 * - Contractors: Counts invitations sent TO them
 *
 * Returns:
 * {
 *   total: 5,  // Total pending invitations
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
    const userRole = session.user.role;

    // CONTRACTORS: Count invitations sent TO their email
    if (userRole === "PRO") {
      // Get contractor's email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user?.email) {
        return NextResponse.json({ total: 0 });
      }

      const totalPending = await prisma.invitation.count({
        where: {
          invitedEmail: user.email,
          role: "PRO",
          status: "PENDING",
        },
      });

      return NextResponse.json({ total: totalPending });
    }

    // HOMEOWNERS: Count invitations across all their stats
    const homes = await prisma.home.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const homeIds = homes.map((h) => h.id);

    if (homeIds.length === 0) {
      return NextResponse.json({ total: 0 });
    }

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