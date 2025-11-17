// app/api/invitations/pro-to-home/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, InvitationStatus } from "@prisma/client";

type InviteBody = {
  homeId?: string;
  homeAddress?: string;
  email?: string;
  invitedEmail?: string;
  message?: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const inviterEmail = session.user.email.toLowerCase();

  let body: InviteBody;
  try {
    body = (await req.json()) as InviteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { homeId: bodyHomeId, homeAddress, email, invitedEmail, message } = body;

  // Use whichever one is provided
  const emailToUse = email || invitedEmail;

  if (!emailToUse) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = emailToUse.toLowerCase();
  const safeMessage = message?.trim() ? message.trim() : null;

  if (normalizedEmail === inviterEmail) {
    return NextResponse.json(
      { error: "You cannot invite yourself" },
      { status: 400 }
    );
  }

  // ---- Validate that the email belongs to a registered homeowner ----
  const invitedUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!invitedUser) {
    return NextResponse.json(
      {
        error: "This email is not registered. Please ask the homeowner to sign up first.",
        signupUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?role=homeowner`,
      },
      { status: 400 }
    );
  }

  if (invitedUser.role !== "HOMEOWNER") {
    return NextResponse.json(
      {
        error: "This email belongs to a contractor account. Please use the homeowner's email address.",
      },
      { status: 400 }
    );
  }

  // ---- Resolve homeId without ever creating a Home ----
  let homeId: string | null = null;

  if (bodyHomeId) {
    homeId = bodyHomeId;
  } else if (homeAddress) {
    const parts = homeAddress.split(",").map((s) => s.trim());
    const street = parts[0] || "";
    const city = parts[1] || "";
    const stateZip = parts[2]?.split(" ") || [];
    const state = stateZip[0] || "";
    const zip = stateZip[1] || "";

    const normalizedAddress = `${street}${city}${state}${zip}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const home = await prisma.home.findFirst({
      where: { normalizedAddress },
    });

    if (!home) {
      return NextResponse.json(
        {
          error:
            "This property is not in MyHomeDox yet. The homeowner must add/claim the home first.",
        },
        { status: 400 }
      );
    }

    homeId = home.id;
  } else {
    return NextResponse.json(
      { error: "Either homeId or homeAddress is required" },
      { status: 400 }
    );
  }

  if (!homeId) {
    return NextResponse.json(
      { error: "Failed to resolve home for this invitation" },
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
        { invitedBy: userId },
        { invitedEmail: inviterEmail },
      ],
    },
  });

  if (blockingInvitation) {
    const statusMessages = {
      PENDING: "You already have a pending invitation for this property.",
      ACCEPTED: "You already accepted an invitation for this property.",
      DECLINED: "This homeowner declined your previous invitation.",
    };

    return NextResponse.json(
      { error: statusMessages[blockingInvitation.status as keyof typeof statusMessages] || "You already have an invitation for this property." },
      { status: 409 }
    );
  }

  // ---- BLOCK DUPLICATES: Check if this pro has ANY ACTIVE connection for this home ----
  const anyConnection = await prisma.connection.findFirst({
    where: {
      homeId,
      status: "ACTIVE",
      OR: [
        { contractor: { id: userId } },
        { homeowner: { id: userId } },
      ],
    },
  });

  if (anyConnection) {
    return NextResponse.json(
      { error: "You already have an active connection for this property." },
      { status: 409 }
    );
  }

  // ---- Create new invitation ----
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const invitation = await prisma.invitation.create({
    data: {
      invitedBy: userId,
      invitedEmail: normalizedEmail,
      invitedName: null,
      homeId,
      role: Role.HOMEOWNER,
      message: safeMessage,
      status: InvitationStatus.PENDING,
      expiresAt,
    },
  });

  return NextResponse.json({ invitation }, { status: 201 });
}