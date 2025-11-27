// =============================================================================
// app/home/page.tsx
// =============================================================================
// Redirects user to their most recent home, or shows pre-claim UI

import "server-only";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HomePreClaim from "./_components/HomePreClaim";

export const dynamic = "force-dynamic";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  proStatus?: string | null;
};

export default async function HomeIndex() {
  const session = await getServerSession(authConfig);

  const userId = session?.user
    ? (session.user as SessionUser).id
    : undefined;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastHomeId: true },
    });

    let homeId: string | null = null;

    // Check if lastHomeId is still accessible
    if (user?.lastHomeId) {
      const lastHome = await prisma.home.findFirst({
        where: {
          id: user.lastHomeId,
          OR: [
            { ownerId: userId },
            { access: { some: { userId } } },
          ],
        },
        select: { id: true },
      });

      if (lastHome) {
        homeId = lastHome.id;
      } else {
        // Clear invalid lastHomeId
        await prisma.user.update({
          where: { id: userId },
          data: { lastHomeId: null },
        });
      }
    }

    // If no valid lastHomeId, find first owned home
    if (!homeId) {
      const owned = await prisma.home.findFirst({
        where: { ownerId: userId },
        select: { id: true },
      });
      homeId = owned?.id ?? null;
    }

    // If no owned home, find first shared home
    if (!homeId) {
      const shared = await prisma.homeAccess.findFirst({
        where: { userId },
        select: { homeId: true },
      });
      homeId = shared?.homeId ?? null;
    }

    if (homeId) return redirect(`/home/${homeId}`);
  }

  // Not logged in or no claimed home → show pre-claim UI
  return <HomePreClaim />;
}