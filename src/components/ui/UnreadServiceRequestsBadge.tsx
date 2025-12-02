// components/UnreadServiceRequestsBadge.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function UnreadServiceRequestsBadge() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return null;
  }

  // Check if user is a contractor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    return null;
  }

  // Count unread job requests (PENDING that contractor hasn't responded to)
  const unreadCount = await prisma.serviceRequest.count({
    where: {
      contractorId: session.user.id,
      status: "PENDING",
      respondedAt: null,
    },
  });

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center justify-center rounded-full bg-[#33C17D] px-2 py-0.5 text-xs font-medium text-white">
      {unreadCount}
    </span>
  );
}