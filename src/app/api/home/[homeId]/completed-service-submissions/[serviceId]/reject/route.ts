// app/api/stats/[homeId]/document-completed-service-submissions/[serviceId]/reject/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { ServiceSubmissionStatus } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ homeId: string; serviceId: string }> }
) {
  const { homeId, serviceId } = await params;
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
        },
      },
    },
  });

  if (!serviceRecord) {
    return NextResponse.json(
      { error: "Work record not found" },
      { status: 404 }
    );
  }

  if (serviceRecord.homeId !== homeId) {
    return NextResponse.json(
      { error: "Work record does not belong to this stats" },
      { status: 400 }
    );
  }

  // Update document-completed-service-submissions record to rejected
  const updated = await prisma.serviceRecord.update({
    where: { id: serviceId },
    data: {
      status: ServiceSubmissionStatus.REJECTED,
      rejectionReason: "Rejected by homeowner",
    },
  });

  // Notify contractor
  await prisma.notification.create({
    data: {
      userId: serviceRecord.contractorId,
      channel: "EMAIL",
      subject: "Work record rejected",
      payload: {
        type: "WORK_REJECTED",
        serviceRecordId: serviceRecord.id,
        serviceType: serviceRecord.serviceType,
      },
    },
  });

  return NextResponse.json({
    success: true,
    serviceRecord: updated,
  });
}