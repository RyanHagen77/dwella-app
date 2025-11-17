// app/api/home/[homeId]/work/[workId]/reject/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { WorkRequestStatus } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ homeId: string; workId: string }> }
) {
  const { homeId, workId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireHomeAccess(homeId, session.user.id);

  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workId },
    include: {
      contractor: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!workRecord) {
    return NextResponse.json(
      { error: "Work record not found" },
      { status: 404 }
    );
  }

  if (workRecord.homeId !== homeId) {
    return NextResponse.json(
      { error: "Work record does not belong to this home" },
      { status: 400 }
    );
  }

  // Update work record to rejected
  const updated = await prisma.workRecord.update({
    where: { id: workId },
    data: {
      status: WorkRequestStatus.REJECTED,
      rejectionReason: "Rejected by homeowner",
    },
  });

  // Notify contractor
  await prisma.notification.create({
    data: {
      userId: workRecord.contractorId,
      channel: "EMAIL",
      subject: "Work record rejected",
      payload: {
        type: "WORK_REJECTED",
        workRecordId: workRecord.id,
        workType: workRecord.workType,
      },
    },
  });

  return NextResponse.json({
    success: true,
    workRecord: updated,
  });
}