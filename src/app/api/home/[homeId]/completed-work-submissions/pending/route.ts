/**
 * PENDING COMPLETED WORK SUBMISSIONS COUNT (HOMEOWNER)
 *
 * GET /api/stats/[homeId]/completed-work-submissions/pending
 * Returns count of work submissions needing homeowner review
 *
 * Used by homeowner dashboard badge
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { WorkSubmissionStatus } from "@prisma/client";

export const runtime = "nodejs";

type RouteParams = { homeId: string };

export async function GET(
  _req: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const { homeId } = await params;

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await requireHomeAccess(homeId, session.user.id);
    } catch (error) {
      // Handle notFound() error from requireHomeAccess
      if (error && typeof error === "object" && "digest" in error) {
        return NextResponse.json({ error: "Home not found" }, { status: 404 });
      }
      throw error;
    }

    const pendingCount = await prisma.workRecord.count({
      where: {
        homeId,
        isVerified: false,
        status: {
          in: [
            WorkSubmissionStatus.PENDING_REVIEW,
            WorkSubmissionStatus.DOCUMENTED_UNVERIFIED,
            WorkSubmissionStatus.DOCUMENTED,
            WorkSubmissionStatus.DISPUTED,
          ],
        },
        archivedAt: null,
      },
    });

    return NextResponse.json({ total: pendingCount });
  } catch (error) {
    console.error("Error fetching pending work submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending work submissions" },
      { status: 500 }
    );
  }
}