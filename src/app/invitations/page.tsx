/**
 * INVITATIONS LIST PAGE (Contractor)
 *
 * Location: app/invitations/page.tsx
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { textMeta } from "@/lib/glass";

import InvitationsClient from "./InvitationsClient";

type InvitationDTO = {
  id: string;
  invitedEmail: string;
  invitedName: string | null;
  role: string;
  message: string | null;
  status: string;
  createdAt: string; // ISO
  expiresAt: string; // ISO
  inviter: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      rating: number | null;
      verified: boolean;
    } | null;
  };
};

export default async function InvitationsPage() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user?.email) redirect("/dashboard");

  const invitations = await prisma.invitation.findMany({
    where: { invitedEmail: user.email },
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
    },
    orderBy: { createdAt: "desc" },
  });

  const dto: InvitationDTO[] = invitations.map((inv) => ({
    id: inv.id,
    invitedEmail: inv.invitedEmail,
    invitedName: inv.invitedName,
    role: inv.role,
    message: inv.message,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    inviter: {
      id: inv.inviter.id,
      name: inv.inviter.name,
      email: inv.inviter.email,
      image: inv.inviter.image,
      proProfile: inv.inviter.proProfile
        ? {
            businessName: inv.inviter.proProfile.businessName,
            company: inv.inviter.proProfile.company,
            phone: inv.inviter.proProfile.phone,
            rating: inv.inviter.proProfile.rating,
            verified: inv.inviter.proProfile.verified,
          }
        : null,
    },
  }));

  const pendingCount = dto.filter((i) => (i.status || "").toUpperCase() === "PENDING").length;

  return (
    <main className="relative min-h-screen text-white">
      {/* Background */}
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

      {/* Frame */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Invitations" }]} />

        <PageHeader
          backHref="/dashboard"
          backLabel="Back to dashboard"
          title="Invitations"
          meta={
            <span className={textMeta}>
              {pendingCount} pending • {dto.length} total
            </span>
          }
        />

        <InvitationsClient invitations={dto} />

        <div className="h-12" />
      </div>
    </main>
  );
}