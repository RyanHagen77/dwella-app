/**
 * HOME INVITATIONS PAGE
 *
 * Location: src/app/home/[homeId]/invitations/page.tsx
 */

export const dynamic = "force-dynamic";

import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { textMeta } from "@/lib/glass";

import HomeInvitationsClient from "./HomeInvitationsClient";

export default async function HomeInvitationsPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  await requireHomeAccess(homeId, userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) redirect("/dashboard");

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { address: true, city: true, state: true, zip: true },
  });
  if (!home) notFound();

  const addrLine = [home.address, home.city, home.state, home.zip].filter(Boolean).join(", ");

  // Invitations received (to this homeowner for this home)
  const receivedRaw = await prisma.invitation.findMany({
    where: { invitedEmail: user.email, homeId },
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
      home: { select: { id: true, address: true, city: true, state: true, zip: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Invitations sent (by this homeowner for this home)
  const sentRaw = await prisma.invitation.findMany({
    where: { homeId, invitedBy: userId },
    include: {
      home: { select: { id: true, address: true, city: true, state: true, zip: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize Dates for client safety
  const receivedInvitations = receivedRaw.map((inv) => ({
    ...inv,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    inviter: inv.inviter
      ? {
          ...inv.inviter,
          proProfile: inv.inviter.proProfile
            ? {
                ...inv.inviter.proProfile,
                rating: inv.inviter.proProfile.rating ?? null,
              }
            : null,
        }
      : null,
    home: inv.home
      ? {
          ...inv.home,
        }
      : null,
  }));

  const sentInvitations = sentRaw.map((inv) => ({
    ...inv,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    home: inv.home ? { ...inv.home } : null,
  }));

  const pendingReceived = receivedInvitations.filter((i) => i.status === "PENDING").length;
  const pendingSent = sentInvitations.filter((i) => i.status === "PENDING").length;
  const totalPending = pendingReceived + pendingSent;
  const total = receivedInvitations.length + sentInvitations.length;

  return (
    <main className="relative min-h-screen text-white">
      {/* Background (kept as-is) */}
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

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Invitations" },
          ]}
        />

        <PageHeader
          backHref={`/home/${homeId}`}
          backLabel="Back to home"
          title="Invitations"
          meta={
            <span className={textMeta}>
              {total} {total === 1 ? "invitation" : "invitations"}
              {totalPending > 0 ? <span className="ml-2 text-orange-400">({totalPending} pending)</span> : null}
            </span>
          }
        />

        {/* Single body surface (no glass-on-glass) */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <HomeInvitationsClient
            homeId={homeId}
            homeAddress={addrLine}
            receivedInvitations={receivedInvitations as any}
            sentInvitations={sentInvitations as any}
          />
        </section>

        <div className="h-12" />
      </div>
    </main>
  );
}