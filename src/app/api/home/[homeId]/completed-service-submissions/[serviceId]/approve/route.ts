// app/api/stats/[homeId]/document-completed-service-submissions/[serviceId]/approve/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { ServiceSubmissionStatus } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: { homeId: string; serviceId: string } }
) {
  const { homeId, serviceId } = params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireHomeAccess(homeId, session.user.id);

  const serviceRecord = await prisma.serviceRecord.findUnique({
    where: { id: serviceId },
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

  if (!serviceRecord) {
    return NextResponse.json(
      { error: "Service record not found" },
      { status: 404 }
    );
  }

  if (serviceRecord.homeId !== homeId) {
    return NextResponse.json(
      { error: "Service record does not belong to this stats" },
      { status: 400 }
    );
  }

  // 1) Update ServiceRecord to approved
  const updated = await prisma.serviceRecord.update({
    where: { id: serviceId },
    data: {
      status: ServiceSubmissionStatus.APPROVED,
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
      homeId: serviceRecord.homeId,
      title: serviceRecord.serviceType,
      note: serviceRecord.description,
      date: serviceRecord.serviceDate,
      kind: "maintenance",
      vendor: serviceRecord.contractor.name || serviceRecord.contractor.email,
      cost: serviceRecord.cost ? Number(serviceRecord.cost) : null,
      createdBy: session.user.id,
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
    },
  });

  // 3) Move/link attachments from ServiceRecord → Record
  // If your Attachment model has `serviceRecordId`, this will associate all of them
  if (serviceRecord.attachments.length > 0) {
    await prisma.attachment.updateMany({
      where: {
        homeId,
        // adjust this field name if your schema is different
        serviceRecordId: serviceId,
      },
      data: {
        recordId: finalRecord.id,
        // Optional: if you want them visible to all stats members by default
        // visibility: "HOME",
      },
    });
  }

  // 4) Link document-completed-service-submissions record to final record
  await prisma.serviceRecord.update({
    where: { id: serviceId },
    data: { finalRecordId: finalRecord.id },
  });

  // 5) Create/update connection
  const existing = await prisma.connection.findFirst({
    where: {
      homeId,
      contractorId: serviceRecord.contractorId,
      status: "ACTIVE",
    },
  });

  if (!existing) {
    await prisma.connection.create({
      data: {
        homeownerId: session.user.id,
        contractorId: serviceRecord.contractorId,
        homeId,
        status: "ACTIVE",
        invitedBy: session.user.id,
        establishedVia: "VERIFIED_SERVICE",
        sourceRecordId: serviceRecord.id,
        verifiedServiceCount: 1,
        totalSpent: serviceRecord.cost ? Number(serviceRecord.cost) : 0,
      },
    });
  }

  // 6) Notify contractor
  await prisma.notification.create({
    data: {
      userId: serviceRecord.contractorId,
      channel: "EMAIL",
      subject: "Your document-completed-service-submissions has been approved",
      payload: {
        type: "WORK_APPROVED",
        serviceRecordId: serviceRecord.id,
        serviceType: serviceRecord.serviceType,
      },
    },
  });

  return NextResponse.json({
    success: true,
    serviceRecord: updated,
    finalRecord,
  });
}