// app/pro/contractor/dashboard/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { serializeConnections } from "@/lib/serialize";
import { ContractorDashboardClient } from "./ContractorDashboardClient";

export default async function ProDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  if (!session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  if (session.user.proStatus === "PENDING") {
    redirect("/pro/contractor/pending");
  }

  const proProfile = await prisma.proProfile.findUnique({
    where: { userId },
    select: {
      businessName: true,
      type: true,
      rating: true,
      verified: true,
    },
  });

  // Unread messages for this contractor
  const unreadMessagesCount = await prisma.message.count({
    where: {
      connection: {
        contractorId: userId,
        status: "ACTIVE",
      },
      // Don't count messages the contractor sent themselves
      senderId: { not: userId },
      // Only messages that this contractor hasn't marked as read
      reads: {
        none: {
          userId,
        },
      },
    },
  });

  // Get active connections
  const connections = await prisma.connection.findMany({
    where: { contractorId: userId, status: "ACTIVE" },
    include: {
      homeowner: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          photos: true,
        },
      },
    },
    orderBy: { lastServiceDate: "desc" },
  });

  // Count pending invitations
  const pendingInvitationsCount = await prisma.invitation.count({
    where: {
      invitedBy: userId,
      status: "PENDING",
    },
  });

  // Count pending service requests
  const pendingServiceRequestsCount = await prisma.serviceRequest.count({
    where: {
      contractorId: userId,
      status: { in: ["PENDING", "QUOTED"] },
    },
  });

  // Get pending service requests with details
  const pendingServiceRequests = await prisma.serviceRequest.findMany({
    where: {
      contractorId: userId,
      status: { in: ["PENDING", "QUOTED"] },
    },
    include: {
      home: {
        select: {
          address: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // 🔧 Serialize pendingServiceRequests to convert Decimal -> number
  const serializedPendingServiceRequests = pendingServiceRequests.map((req) => ({
    ...req,
    budgetMin: req.budgetMin != null ? Number(req.budgetMin) : null,
    budgetMax: req.budgetMax != null ? Number(req.budgetMax) : null,
  }));

  // Count work records pending review
  const pendingServiceCount = await prisma.serviceRecord.count({
    where: {
      contractorId: userId,
      isVerified: false,
      status: {
        in: ["PENDING_REVIEW", "DOCUMENTED_UNVERIFIED", "DOCUMENTED"],
      },
      archivedAt: null,
    },
  });

  // Get recent work records
  const recentService = await prisma.serviceRecord.findMany({
    where: {
      contractorId: userId,
      archivedAt: null,
    },
    include: {
      home: {
        select: {
          address: true,
          city: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { serviceDate: "desc" },
    take: 5,
  });

  // Serialize recentService to convert Decimal to number
  const serializedRecentService = recentService.map((work) => ({
    ...work,
    cost: work.cost ? Number(work.cost) : null,
  }));

  // Serialize connections
  const serializedConnections = serializeConnections(connections);
  const now = new Date();

  const connectionsWithMetrics = serializedConnections.map((conn) => {
    const lastServiceDate = conn.lastServiceDate ? new Date(conn.lastServiceDate) : null;
    const daysSinceLastService = lastServiceDate
      ? Math.floor(
          (now.getTime() - lastServiceDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      ...conn,
      lastServiceDate,
      createdAt: new Date(conn.createdAt),
      updatedAt: new Date(conn.updatedAt),
      daysSinceLastService,
    };
  });

  // Find connections needing follow-up (>180 days)
  const needsFollowUp = connectionsWithMetrics.filter(
    (c) => c.daysSinceLastService === null || c.daysSinceLastService > 180
  );

  const contractorRemindersCount = 0;
  const upcomingReminders: unknown[] = [];

  return (
    <ContractorDashboardClient
      proProfile={proProfile}
      connections={connectionsWithMetrics}
      pendingInvitationsCount={pendingInvitationsCount}
      pendingServiceRequestsCount={pendingServiceRequestsCount}
      pendingServiceRequests={serializedPendingServiceRequests}
      pendingServiceCount={pendingServiceCount}
      recentService={serializedRecentService}
      needsFollowUp={needsFollowUp}
      contractorRemindersCount={contractorRemindersCount}
      upcomingReminders={upcomingReminders}
      unreadMessagesCount={unreadMessagesCount}
    />
  );
}