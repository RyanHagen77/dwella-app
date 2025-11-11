import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email/invitation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitedEmail, invitedName, homeAddress, message, role } = await req.json();

    // Validate inputs
    if (!invitedEmail || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: invitedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        invitedEmail,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // For PRO inviting HOMEOWNER - get contractor's info for email
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        proProfile: true,
      },
    });

    // Create invitation (expires in 7 days)
    const invitation = await prisma.invitation.create({
      data: {
        invitedBy: session.user.id,
        invitedEmail,
        invitedName,
        role,
        message,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send invitation email
    await sendInvitationEmail({
      to: invitedEmail,
      inviterName: inviter?.name || "A contractor",
      inviterCompany: inviter?.proProfile?.businessName || inviter?.proProfile?.company,
      inviteeName: invitedName,
      message,
      token: invitation.token,
      role,
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.invitedEmail,
        status: invitation.status,
      },
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}