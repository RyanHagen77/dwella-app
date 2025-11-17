// app/home/[homeId]/pending-work/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireHomeAccess } from "@/lib/authz";
import PendingWorkClient from "./PendingWorkClient";

export default async function PendingWorkPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      address: true,
      city: true,
      state: true,
    },
  });

  if (!home) {
    redirect("/dashboard");
  }

  const homeAddress = `${home.address}${home.city ? `, ${home.city}` : ""}${home.state ? `, ${home.state}` : ""}`;

  // Get pending work records with attachments
  const pendingWorkRecords = await prisma.workRecord.findMany({
    where: {
      homeId,
      isVerified: false,
      status: {
        in: ["DOCUMENTED_UNVERIFIED", "DOCUMENTED", "DISPUTED"],
      },
      archivedAt: null,
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
        },
      },
      attachments: {  // ✅ Add attachments
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

  // Serialize the data for the client
  const pendingWork = pendingWorkRecords.map((work) => ({
    id: work.id,
    workType: work.workType,
    workDate: work.workDate,
    description: work.description,
    cost: work.cost ? Number(work.cost) : null,
    photos: work.photos as string[], // Legacy photos array
    attachments: work.attachments.map(att => ({  // ✅ Serialize attachments
      ...att,
      size: Number(att.size), // Convert bigint to number
    })),
    invoiceUrl: work.invoiceUrl,
    warrantyIncluded: work.warrantyIncluded,
    warrantyLength: work.warrantyLength,
    warrantyDetails: work.warrantyDetails,
    status: work.status,
    contractor: work.contractor,
    invitation: work.invitation,
  }));

  return (
    <PendingWorkClient
      homeId={homeId}
      homeAddress={homeAddress}
      pendingWork={pendingWork}
    />
  );
}