// app/api/user/stats/pending-document-completed-work-submissions-records/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/user/stats/pending-document-completed-work-submissions-records?homeId=xyz
 * Fetches all unverified document-completed-work-submissions-records at user's properties
 */
export async function GET(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("homeId");

  // Get all unverified document-completed-work-submissions-records records
  const pendingWork = await prisma.workRecord.findMany({
    where: {
      home: {
        ownerId: session.user.id,
      },
      isVerified: false,
      status: {
        in: ["DOCUMENTED_UNVERIFIED", "DOCUMENTED", "DISPUTED"],
      },
      archivedAt: null,
      ...(homeId && { homeId }),
    },
    include: {
      home: {
        select: {
          id: true,
          address: true,
          addressLine2: true,
          city: true,
          state: true,
          zip: true,
        },
      },
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
              rating: true,
              completedJobs: true,
              verified: true,
            },
          },
        },
      },
      invitation: {
        select: {
          id: true,
          message: true,
          invitationType: true,
        },
      },
    },
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
  });

  // Group by stats for easier display
  const groupedByHome = pendingWork.reduce(
    (acc, work) => {
      const homeId = work.homeId;
      if (!acc[homeId]) {
        acc[homeId] = {
          home: work.home,
          pendingWork: [],
        };
      }
      acc[homeId].pendingWork.push(work);
      return acc;
    },
    {} as Record<
      string,
      {
        home: {
          id: string;
          address: string;
          addressLine2: string | null;
          city: string;
          state: string;
          zip: string;
        };
        pendingWork: typeof pendingWork;
      }
    >
  );

  return NextResponse.json({
    pendingWork,
    groupedByHome: Object.values(groupedByHome),
    totalPending: pendingWork.length,
  });
}