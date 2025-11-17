import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import { WorkRequestStatus } from "@prisma/client";
import WorkClient from "./WorkClient";

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

  // Pending work (DOCUMENTED + DOCUMENTED_UNVERIFIED) + attachments
  const pendingWorkRaw = await prisma.workRecord.findMany({
    where: {
      homeId,
      status: {
        in: [
          WorkRequestStatus.DOCUMENTED,
          WorkRequestStatus.DOCUMENTED_UNVERIFIED,
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

  // Serialize dates and decimals
  const connections = connectionsRaw.map((conn) => ({
    id: conn.id,
    contractor: conn.contractor,
    createdAt: conn.createdAt.toISOString(),
  }));

  const pendingWork = pendingWorkRaw.map((work) => ({
    id: work.id,
    title: work.workType,
    description: work.description,
    workDate: work.workDate.toISOString(),
    cost: work.cost ? Number(work.cost) : null,
    createdAt: work.createdAt.toISOString(),
    contractor: work.contractor,
    attachments: work.attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      mimeType: a.mimeType,
      size: Number(a.size),
      url: a.url,
    })),
  }));

  return (
    <WorkClient
      homeId={homeId}
      homeAddress={`${home.address}${home.city ? `, ${home.city}` : ""}${
        home.state ? `, ${home.state}` : ""
      }`}
      connections={connections}
      pendingWork={pendingWork}
    />
  );
}