/**
 * PENDING SERVICE SUBMISSIONS COUNT - ALL HOMES
 *
 * GET /api/pending-service-submissions
 * Returns total count of pending service submissions across all stats the user owns
 *
 * Location: app/api/pending-completed-service-submissions/route.ts
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServiceSubmissionStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pendingCount = await prisma.serviceRecord.count({
      where: {
        home: {
          ownerId: session.user.id,
        },
        isVerified: false,
        status: {
          in: [
            ServiceSubmissionStatus.PENDING_REVIEW,
            ServiceSubmissionStatus.DOCUMENTED_UNVERIFIED,
            ServiceSubmissionStatus.DOCUMENTED,
            ServiceSubmissionStatus.DISPUTED,
          ],
        },
        archivedAt: null,
      },
    });

    return NextResponse.json({ total: pendingCount });
  } catch (error) {
    console.error("Error fetching pending service submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending work submissions" },
      { status: 500 }
    );
  }
}