// app/home-invite/[token]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InviteLandingClient } from "./InviteLandingClient";

export const dynamic = "force-dynamic";

async function getHomeInviteByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      inviter: {
        select: {
          name: true,
          email: true,
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
  });

  if (!invitation) return null;

  const expired = invitation.expiresAt < new Date();

  const simplifiedInvite = expired
    ? null
    : {
        id: invitation.id,
        invitedEmail: invitation.invitedEmail,
        invitedName: invitation.invitedName,
        message: invitation.message,
        role: invitation.role,
        createdAt: invitation.createdAt,
        inviter: {
          name: invitation.inviter.name,
          email: invitation.inviter.email,
          businessName: invitation.inviter.proProfile?.businessName ?? null,
          company: invitation.inviter.proProfile?.company ?? null,
          phone: invitation.inviter.proProfile?.phone ?? null,
          verified: invitation.inviter.proProfile?.verified ?? false,
          rating: invitation.inviter.proProfile?.rating ?? null,
        },
      };

  return { expired, invite: simplifiedInvite };
}

export default async function HomeInvitePage({
  params,
}: {
  params: { token: string };
}) {
  const result = await getHomeInviteByToken(params.token);

  if (!result) {
    notFound();
  }

  return (
    <InviteLandingClient
      invite={result.invite}
      expired={result.expired}
    />
  );
}