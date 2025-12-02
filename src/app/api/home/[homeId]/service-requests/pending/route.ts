/**
 * HOMEOWNER PENDING JOB REQUESTS COUNT
 *
 * GET /api/stats/[homeId]/service-requests/pending
 * Returns count of job requests awaiting contractor response
 *
 * Used by homeowner dashboard badge
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export const runtime = "nodejs";

type RouteParams = { homeId: string };

export async function GET(
  _req: Request,
  { params }: { params: RouteParams }
) {
  const { homeId } = params;

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireHomeAccess(homeId, session.user.id);

    const userId = session.user.id;

    // Count job requests awaiting contractor response or homeowner to accept quote
    const pendingCount = await prisma.serviceRequest.count({
      where: {
        homeId,
        homeownerId: userId,
        status: {
          in: ["PENDING", "QUOTED"], // Waiting for contractor response or homeowner to accept quote
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