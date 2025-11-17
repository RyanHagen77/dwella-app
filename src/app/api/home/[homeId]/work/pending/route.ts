import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { WorkRequestStatus } from "@prisma/client";

export const runtime = "nodejs";

type RouteParams = { homeId: string };

export async function GET(
  _req: Request,
  { params }: { params: RouteParams }
) {
  const { homeId } = params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireHomeAccess(homeId, session.user.id);

  const pendingWork = await prisma.workRecord.findMany({
    where: {
      homeId,
      isVerified: false,
      status: {
        in: [
          WorkRequestStatus.DOCUMENTED_UNVERIFIED,
          WorkRequestStatus.DOCUMENTED,
          WorkRequestStatus.DISPUTED,
        ],
      },
      archivedAt: null,
    },
    select: {
      id: true,
      workType: true,
      description: true,
      workDate: true,
      cost: true,
      createdAt: true,
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
              verified: true,
            },
          },
        },
      },
    },
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    pendingWork,
    totalPending: pendingWork.length,
  });
}