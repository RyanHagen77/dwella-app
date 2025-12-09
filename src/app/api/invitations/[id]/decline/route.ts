// app/api/invitations/[serviceId]/decline/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvitationStatus } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userEmail = session.user.email.toLowerCase();

  const invitation = await prisma.invitation.findUnique({
    where: { id },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  if (invitation.invitedEmail.toLowerCase() !== userEmail) {
    return NextResponse.json(
      { error: "You are not the invitee for this invitation" },
      { status: 403 }
    );
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    return NextResponse.json(
      { error: "Invitation is not pending" },
      { status: 400 }
    );
  }

  const updated = await prisma.invitation.update({
    where: { id },
    data: { status: InvitationStatus.DECLINED },
  });

  return NextResponse.json({ invitation: updated }, { status: 200 });
}