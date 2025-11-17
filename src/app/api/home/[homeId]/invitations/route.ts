// app/api/home/[homeId]/invitations/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ homeId: string }> } // ✅ Add Promise<>
) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { homeId } = await params; // ✅ Add await
  const userEmail = session.user.email.toLowerCase();

  // Ensure user has access to this home
  await requireHomeAccess(homeId, session.user.id);

  // Get invitations SENT from this home by this user
  const sentInvitations = await prisma.invitation.findMany({
    where: {
      homeId,
      invitedBy: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get invitations RECEIVED for this home (where user's email is invited)
  const receivedInvitations = await prisma.invitation.findMany({
    where: {
      homeId,
      invitedEmail: userEmail,
    },
    include: {
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    sentInvitations,
    receivedInvitations,
  });
}