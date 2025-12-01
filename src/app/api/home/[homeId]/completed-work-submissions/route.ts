/**
 * COMPLETED WORK SUBMISSIONS LIST (HOMEOWNER)
 *
 * GET /api/stats/[homeId]/completed-work-submissions
 * List work submissions for this stats
 *
 * Location: app/api/stats/[homeId]/completed-work-submissions/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

type RouteParams = { homeId: string };

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const { homeId } = params;

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireHomeAccess(homeId, session.user.id);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const verified = searchParams.get("verified");

    const where: Prisma.WorkRecordWhereInput = {
      homeId,
      archivedAt: null,
    };

    if (status) {
      where.status = status as Prisma.EnumWorkSubmissionStatusFilter;
    }

    if (verified === "true") {
      where.isVerified = true;
    } else if (verified === "false") {
      where.isVerified = false;
    }

    const workSubmissions = await prisma.workRecord.findMany({
      where,
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            proProfile: {
              select: {
                businessName: true,
                company: true,
                phone: true,
                verified: true,
                rating: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            url: true,
            filename: true,
            mimeType: true,
          },
        },
        finalRecord: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
      },
      orderBy: [
        { workDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ workSubmissions });
  } catch (error) {
    console.error("Error fetching work submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch work submissions" },
      { status: 500 }
    );
  }
}