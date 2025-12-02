import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import { WorkSubmissionStatus } from "@prisma/client";
import CompletedWorkSubmissionsClient from "./CompletedWorkSubmissionsClient";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) notFound();
  await requireHomeAccess(homeId, session.user.id);

  // Connected contractors
  const connectionsRaw = await prisma.connection.findMany({
    where: {
      homeId,
      status: "ACTIVE",
    },
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
              rating: true,
              verified: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Pending work submissions (DOCUMENTED + DOCUMENTED_UNVERIFIED) + attachments
  const pendingWorkRaw = await prisma.workRecord.findMany({
    where: {
      homeId,
      status: {
        in: [
          WorkSubmissionStatus.DOCUMENTED,
          WorkSubmissionStatus.DOCUMENTED_UNVERIFIED,
        ],
      },
    },
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
            },
          },
        },
      },
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Service requests (renamed from JobRequest)
  const serviceRequestsRaw = await prisma.serviceRequest.findMany({
    where: {
      homeId,
      homeownerId: session.user.id,
    },
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
      quote: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
          expiresAt: true,
        },
      },
      workRecord: {
        select: {
          id: true,
          status: true,
          workDate: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  if (!home) notFound();

  // Serialize dates and decimals - filter out null contractors
  const connections = connectionsRaw
    .filter((conn) => conn.contractor !== null)
    .map((conn) => ({
      id: conn.id,
      contractor: conn.contractor!,
      createdAt: conn.createdAt.toISOString(),
    }));

  const pendingWork = pendingWorkRaw
    .filter((work) => work.contractor !== null)
    .map((work) => ({
      id: work.id,
      title: work.workType,
      description: work.description,
      workDate: work.workDate.toISOString(),
      cost: work.cost ? Number(work.cost) : null,
      createdAt: work.createdAt.toISOString(),
      contractor: work.contractor!,
      attachments: work.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        size: Number(a.size),
        url: a.url,
      })),
    }));

  const serviceRequests = serviceRequestsRaw
    .filter((sr) => sr.contractor !== null)
    .map((sr) => ({
      id: sr.id,
      title: sr.title,
      description: sr.description,
      category: sr.category,
      urgency: sr.urgency,
      budgetMin: sr.budgetMin ? Number(sr.budgetMin) : null,
      budgetMax: sr.budgetMax ? Number(sr.budgetMax) : null,
      desiredDate: sr.desiredDate?.toISOString() || null,
      status: sr.status,
      createdAt: sr.createdAt.toISOString(),
      updatedAt: sr.updatedAt.toISOString(),
      respondedAt: sr.respondedAt?.toISOString() || null,
      contractor: sr.contractor!,
      quote: sr.quote
        ? {
            id: sr.quote.id,
            totalAmount: Number(sr.quote.totalAmount),
            status: sr.quote.status,
            expiresAt: sr.quote.expiresAt?.toISOString() || null,
          }
        : null,
      workRecord: sr.workRecord
        ? {
            id: sr.workRecord.id,
            status: sr.workRecord.status,
            workDate: sr.workRecord.workDate.toISOString(),
          }
        : null,
    }));

  const homeAddress = `${home.address}${home.city ? `, ${home.city}` : ""}${
    home.state ? `, ${home.state}` : ""
  }${home.zip ? ` ${home.zip}` : ""}`;

  return (
    <CompletedWorkSubmissionsClient
      homeId={homeId}
      homeAddress={homeAddress}
      connections={connections}
      pendingWork={pendingWork}
      serviceRequests={serviceRequests}
    />
  );
}