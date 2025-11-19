/**
 * PENDING WORK COUNT API ROUTE
 *
 * Endpoint: /api/work/pending
 *
 * GET - Returns pending work count for the current user across all homes
 *
 * Works for homeowners - counts work across all homes they own
 *
 * Returns:
 * {
 *   total: 5,  // Total pending work items across all homes
 * }
 *
 * Location: app/api/work/pending/route.ts
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

    // No homes = no work
    if (homeIds.length === 0) {
      return NextResponse.json({ total: 0 });
    }

    // Count pending work items across all homes (anything not approved)
    const totalPending = await prisma.workRecord.count({
      where: {
        homeId: { in: homeIds },
        status: {
          in: [
            "PENDING_ACCEPTANCE",
            "READY_TO_DOCUMENT",
            "DOCUMENTED_UNVERIFIED",
            "DOCUMENTED",
            "DISPUTED",
          ],
        },
      },
    });

    return NextResponse.json({ total: totalPending });
  } catch (error) {
    console.error("Error fetching pending work count:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending work count" },
      { status: 500 }
    );
  }
}