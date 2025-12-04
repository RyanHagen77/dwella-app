// app/pro/contractor/invitations/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ContractorInvitationsClient from "./ContractorInvitationsClient";
import type { Prisma } from "@prisma/client";

type ReceivedInvitation = Prisma.InvitationGetPayload<{
  include: {
    inviter: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
        proProfile: {
          select: {
            businessName: true;
            company: true;
            phone: true;
            rating: true;
            verified: true;
          };
        };
      };
    };
    home: {
      select: {
        id: true;
        address: true;
        city: true;
        state: true;
        zip: true;
      };
    };
  };
}>;

type SentInvitation = Prisma.InvitationGetPayload<{
  include: {
    home: {
      select: {
        id: true;
        address: true;
        city: true;
        state: true;
        zip: true;
      };
    };
  };
}>;

export default async function ContractorInvitationsPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get user email for received invitations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    redirect("/dashboard");
  }

  const email = user.email;

  const receivedInvitations: ReceivedInvitation[] =
    await prisma.invitation.findMany({
      where: {
        invitedEmail: {
          equals: email,
          mode: "insensitive",
        },
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

  const sentInvitations: SentInvitation[] = await prisma.invitation.findMany({
    where: { invitedBy: userId },
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
    <>
      <div className="relative mx-auto max-w-7xl p-6">
        <ContractorInvitationsClient
          receivedInvitations={receivedInvitations}
          sentInvitations={sentInvitations}
        />
      </div>
    </>
  );
}