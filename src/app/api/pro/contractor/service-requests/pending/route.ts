/**
 * CONTRACTOR PENDING SERVICE REQUESTS COUNT
 *
 * GET /api/pro/contractor/service-requests/pending
 * Returns count of service requests needing contractor response
 *
 * Used by contractor dashboard badge
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PRO") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = session.user.id;

    // Count service requests that need contractor response
    const pendingCount = await prisma.serviceRequest.count({
      where: {
        contractorId: userId,
        status: {
          in: ["PENDING", "QUOTED"], // Pending response or quoted but not accepted yet
        },
      },
    });

    return NextResponse.json({ total: pendingCount });
  } catch (error) {
    console.error("Error fetching pending service requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending service requests" },
      { status: 500 }
    );
  }
}