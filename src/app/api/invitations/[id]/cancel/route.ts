// app/api/invitations/[workId]/cancel/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const invitation = await prisma.invitation.findUnique({
    where: { id },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  if (invitation.invitedBy !== userId) {
    return NextResponse.json(
      { error: "You did not send this invitation" },
      { status: 403 }
    );
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      { error: "Invitation is not pending" },
      { status: 400 }
    );
  }

  const updated = await prisma.invitation.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ invitation: updated }, { status: 200 });
}