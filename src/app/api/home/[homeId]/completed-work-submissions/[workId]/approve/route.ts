// app/api/stats/[homeId]/document-completed-work-submissions/[workId]/approve/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { WorkSubmissionStatus } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: { homeId: string; workId: string } }
) {
  const { homeId, workId } = params;
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
          name: true,
          email: true,
        },
      },
      // 🔍 include attachments so we can move them
      attachments: {
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
      { error: "Work record does not belong to this stats" },
      { status: 400 }
    );
  }

  // 1) Update WorkRecord to approved
  const updated = await prisma.workRecord.update({
    where: { id: workId },
    data: {
      status: WorkSubmissionStatus.APPROVED,
      isVerified: true,
      claimedBy: session.user.id,
      claimedAt: new Date(),
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
  });

  // 2) Create a permanent Record entry
  const finalRecord = await prisma.record.create({
    data: {
      homeId: workRecord.homeId,
      title: workRecord.workType,
      note: workRecord.description,
      date: workRecord.workDate,
      kind: "maintenance",
      vendor: workRecord.contractor.name || workRecord.contractor.email,
      cost: workRecord.cost ? Number(workRecord.cost) : null,
      createdBy: session.user.id,
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
    },
  });

  // 3) Move/link attachments from WorkRecord → Record
  // If your Attachment model has `workRecordId`, this will associate all of them
  if (workRecord.attachments.length > 0) {
    await prisma.attachment.updateMany({
      where: {
        homeId,
        // adjust this field name if your schema is different
        workRecordId: workId,
      },
      data: {
        recordId: finalRecord.id,
        // Optional: if you want them visible to all stats members by default
        // visibility: "HOME",
      },
    });
  }

  // 4) Link document-completed-work-submissions record to final record
  await prisma.workRecord.update({
    where: { id: workId },
    data: { finalRecordId: finalRecord.id },
  });

  // 5) Create/update connection
  const existing = await prisma.connection.findFirst({
    where: {
      homeId,
      contractorId: workRecord.contractorId,
      status: "ACTIVE",
    },
  });

  if (!existing) {
    await prisma.connection.create({
      data: {
        homeownerId: session.user.id,
        contractorId: workRecord.contractorId,
        homeId,
        status: "ACTIVE",
        invitedBy: session.user.id,
        establishedVia: "VERIFIED_WORK",
        sourceRecordId: workRecord.id,
        verifiedWorkCount: 1,
        totalSpent: workRecord.cost ? Number(workRecord.cost) : 0,
      },
    });
  }

  // 6) Notify contractor
  await prisma.notification.create({
    data: {
      userId: workRecord.contractorId,
      channel: "EMAIL",
      subject: "Your document-completed-work-submissions has been approved",
      payload: {
        type: "WORK_APPROVED",
        workRecordId: workRecord.id,
        workType: workRecord.workType,
      },
    },
  });

  return NextResponse.json({
    success: true,
    workRecord: updated,
    finalRecord,
  });
}