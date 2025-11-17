// app/api/invitations/home-to-pro/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { InvitationStatus } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { homeId, email, message } = body as {
    homeId?: string;
    email?: string;
    message?: string;
  };

  if (!homeId) return NextResponse.json({ error: "homeId is required" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const inviterEmail = session.user.email.toLowerCase();
  const inviteeEmail = email.toLowerCase();
  const safeMessage =
    typeof message === "string" && message.trim().length > 0
      ? message.trim()
      : null;

  // caller really has access to this home
  await requireHomeAccess(homeId, session.user.id);

  // cannot invite yourself
  if (inviterEmail === inviteeEmail) {
    return NextResponse.json(
      { error: "You cannot invite yourself" },
      { status: 400 }
    );
  }

  // 🔎 Check if this email belongs to a user and validate their role/status
  const invitedUser = await prisma.user.findUnique({
    where: { email: inviteeEmail },
    select: {
      id: true,
      email: true,
      role: true,
      proStatus: true,
    },
  });

  // If user exists but is a homeowner
  if (invitedUser && invitedUser.role === "HOMEOWNER") {
    return NextResponse.json(
      {
        error:
          "This email belongs to a homeowner account. Use your contractor's email instead.",
      },
      { status: 400 }
    );
  }

  // If user doesn't exist
  if (!invitedUser) {
    return NextResponse.json(
      {
        error: "This email is not registered. Please share this sign-up link with your contractor:",
        signupUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?role=pro&ref=${session.user.id}`,
      },
      { status: 400 }
    );
  }

  // If user exists but their pro status isn't approved
  if (invitedUser.role === "PRO" && invitedUser.proStatus !== "APPROVED") {
    return NextResponse.json(
      {
        error: "This contractor's account is not yet approved. They need to complete their profile approval first.",
      },
      { status: 400 }
    );
  }

  // ---- BLOCK DUPLICATES: Check if this pro has a blocking invitation for this home ----
  const blockingInvitation = await prisma.invitation.findFirst({
    where: {
      homeId,
      status: {
        in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED, InvitationStatus.DECLINED],
      },
      OR: [
        { invitedBy: invitedUser.id },
        { invitedEmail: inviteeEmail },
      ],
    },
  });

  if (blockingInvitation) {
    const statusMessages = {
      PENDING: "This contractor already has a pending invitation for this property.",
      ACCEPTED: "This contractor already accepted an invitation for this property.",
      DECLINED: "This contractor declined your previous invitation.",
    };

    return NextResponse.json(
      { error: statusMessages[blockingInvitation.status as keyof typeof statusMessages] || "This contractor already has an invitation for this property." },
      { status: 409 }
    );
  }

  // ---- BLOCK DUPLICATES: Check if this pro has ANY ACTIVE connection for this home ----
  const anyConnection = await prisma.connection.findFirst({
    where: {
      homeId,
      status: "ACTIVE",
      OR: [
        { contractor: { id: invitedUser.id } },
        { homeowner: { id: invitedUser.id } },
      ],
    },
  });

  if (anyConnection) {
    return NextResponse.json(
      { error: "This contractor already has an active connection for this property." },
      { status: 409 }
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const invitation = await prisma.invitation.create({
    data: {
      invitedBy: session.user.id,
      invitedEmail: inviteeEmail,
      invitedName: null,
      homeId,
      role: "PRO",
      message: safeMessage,
      status: InvitationStatus.PENDING,
      expiresAt,
    },
  });

  return NextResponse.json({ invitation }, { status: 201 });
}