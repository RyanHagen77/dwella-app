/**
 * PENDING WORK SUBMISSIONS COUNT - ALL HOMES
 *
 * GET /api/pending-work-submissions
 * Returns total count of pending work submissions across all stats the user owns
 *
 * Location: app/api/pending-completed-work-submissions/route.ts
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkSubmissionStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pendingCount = await prisma.workRecord.count({
      where: {
        home: {
          ownerId: session.user.id,
        },
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