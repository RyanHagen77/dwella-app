import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendHomeRecordInvitationEmail } from "@/lib/email";

type RouteContext = {
  params: { id: string };
};

export async function POST(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const invitationId = params.id;

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      home: {
        select: {
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  if (invitation.invitedBy !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending invitations can be resent" },
      { status: 400 }
    );
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invitation has expired. Send a new one instead." },
      { status: 400 }
    );
  }

  const contractorName =
    invitation.inviter?.name || invitation.inviter?.email || "Your contractor";

  const homeAddress = invitation.home
    ? `${invitation.home.address}, ${invitation.home.city}, ${invitation.home.state} ${invitation.home.zip}`
    : null;

  try {
    const emailResult = await sendHomeRecordInvitationEmail({
      to: invitation.invitedEmail,
      homeownerName: invitation.invitedName,
      contractorName,
      homeAddress,
      message: invitation.message,
      token: invitation.token,
    });

    if (!emailResult.success) {
      console.warn(
        `Resend invitation email failed for ${invitation.invitedEmail}:`,
        emailResult.error
      );
      return NextResponse.json(
        { error: "Failed to resend email invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in resend invitation:", err);
    return NextResponse.json(
      { error: "Unexpected error resending invitation" },
      { status: 500 }
    );
  }
}