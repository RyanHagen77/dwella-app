// app/stats/[homeId]/invitations/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireHomeAccess } from "@/lib/authz";
import Image from "next/image";
import HomeInvitationsClient from "./HomeInvitationsClient";

export default async function HomeInvitationsPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Check access to this stats
  await requireHomeAccess(homeId, userId);

  // Get user email (used for "received" invitations)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    redirect("/dashboard");
  }

  // Home details for header
  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  const homeAddress = home
    ? `${home.address}${home.city ? `, ${home.city}` : ""}${
        home.state ? `, ${home.state}` : ""
      }${home.zip ? ` ${home.zip}` : ""}`
    : "";

  // Invitations *to* this homeowner for this stats
  const receivedInvitations = await prisma.invitation.findMany({
    where: {
      invitedEmail: user.email,
      homeId,
    },
    include: {
      inviter: {
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
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Invitations *sent by* this homeowner for this stats
  const sentInvitations = await prisma.invitation.findMany({
    where: {
      homeId,
      // invitedBy is a string (user id), not a relation filter
      invitedBy: userId,
    },
    include: {
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="relative min-h-screen text-white">
      {/* Background to match the rest of the app */}
      <div className="fixed inset-0 -z-50">
        <Image
          src="/myhomedox_home3.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
      </div>

      <HomeInvitationsClient
          homeId={homeId}
          homeAddress={homeAddress}
          receivedInvitations={receivedInvitations}
          sentInvitations={sentInvitations}
        />
    </main>
  );
}