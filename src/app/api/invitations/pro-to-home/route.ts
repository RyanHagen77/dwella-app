// app/api/invitations/pro-to-home/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, InvitationStatus, HomeVerificationStatus } from "@prisma/client";
import { sendInvitationSMS } from "@/lib/twilio";
import { sendHomeRecordInvitationEmail } from "@/lib/email";

type InviteBody = {
  homeId?: string;
  homeAddress?: string;
  email?: string;
  invitedEmail?: string;
  phone?: string;
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

  const {
    homeId: bodyHomeId,
    homeAddress,
    email,
    invitedEmail,
    phone,
    message,
  } = body;

  const emailToUse = email || invitedEmail;

  if (!emailToUse) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!homeAddress && !bodyHomeId) {
    return NextResponse.json(
      { error: "Either homeId or homeAddress is required" },
      { status: 400 }
    );
  }

  const normalizedEmail = emailToUse.toLowerCase();
  const safeMessage = message?.trim() ? message.trim() : null;

  if (normalizedEmail === inviterEmail) {
    return NextResponse.json(
      { error: "You cannot invite yourself" },
      { status: 400 }
    );
  }

  // ---- Parse address if provided ----
  let parsedAddress: {
    address: string;
    city: string;
    state: string;
    zip: string;
    normalizedAddress: string;
  } | null = null;

  if (homeAddress) {
    // Parse "123 Main St, Chicago, IL 60601" format
    const parts = homeAddress.split(",").map((s) => s.trim());
    const address = parts[0] || "";
    const city = parts[1] || "";
    const stateZip = parts[2]?.split(" ") || [];
    const state = stateZip[0] || "";
    const zip = stateZip[1] || "";

    const normalizedAddress = `${address}${city}${state}${zip}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    parsedAddress = { address, city, state, zip, normalizedAddress };
  }

  // ---- Resolve or create homeId ----
  let homeId: string;
  let homeWasCreated = false;

  if (bodyHomeId) {
    const foundHome = await prisma.home.findUnique({
      where: { id: bodyHomeId },
    });

    if (!foundHome) {
      return NextResponse.json({ error: "Home not found" }, { status: 400 });
    }

    homeId = foundHome.id;
  } else if (parsedAddress) {
    const existingHome = await prisma.home.findFirst({
      where: {
        normalizedAddress: parsedAddress.normalizedAddress,
      },
    });

    if (existingHome) {
      homeId = existingHome.id;
    } else {
      const newHome = await prisma.home.create({
        data: {
          address: parsedAddress.address,
          city: parsedAddress.city,
          state: parsedAddress.state,
          zip: parsedAddress.zip,
          normalizedAddress: parsedAddress.normalizedAddress,
          verificationStatus: HomeVerificationStatus.UNVERIFIED,
          ownerId: null,
        },
      });

      homeId = newHome.id;
      homeWasCreated = true;
    }
  } else {
    return NextResponse.json(
      { error: "Failed to resolve home for this invitation" },
      { status: 400 }
    );
  }

  // ---- Check for existing invitations/connections from THIS contractor ----
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      homeId,
      invitedBy: userId,
      status: {
        in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED],
      },
    },
  });

  if (existingInvitation) {
    if (existingInvitation.status === InvitationStatus.PENDING) {
      return NextResponse.json(
        { error: "You already have a pending invitation for this property." },
        { status: 409 }
      );
    }
    if (existingInvitation.status === InvitationStatus.ACCEPTED) {
      return NextResponse.json(
        { error: "You already have an accepted invitation for this property." },
        { status: 409 }
      );
    }
  }

  // Check for active connection
  const existingConnection = await prisma.connection.findFirst({
    where: {
      homeId,
      contractorId: userId,
      status: "ACTIVE",
    },
  });

  if (existingConnection) {
    return NextResponse.json(
      { error: "You already have an active connection for this property." },
      { status: 409 }
    );
  }

  // ---- Get contractor info for messaging ----
  const contractor = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const contractorName = contractor?.name || "Your contractor";

  // ---- Create invitation ----
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
      // token comes from default(cuid()) in your model
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const invitationUrl = `${appUrl}/home-invite/${invitation.token}`;

  const emailHomeAddress =
    homeAddress ||
    (parsedAddress
      ? `${parsedAddress.address}, ${parsedAddress.city}, ${parsedAddress.state} ${parsedAddress.zip}`
      : null);

  // ---- Send email invitation (non-fatal) ----
  try {
    const emailResult = await sendHomeRecordInvitationEmail({
      to: normalizedEmail,
      homeownerName: invitation.invitedName,
      contractorName,
      homeAddress: emailHomeAddress,
      message: safeMessage,
      token: invitation.token,
    });

    if (!emailResult.success) {
      console.warn(
        `Home record invitation email failed for ${normalizedEmail}:`,
        emailResult.error
      );
    }
  } catch (err) {
    console.error("Unexpected error in sendHomeRecordInvitationEmail:", err);
  }

  // ---- Send SMS if phone provided ----
  if (phone) {
    const smsAddress =
      homeAddress ||
      (parsedAddress
        ? `${parsedAddress.address}, ${parsedAddress.city}`
        : "your home");

    const smsResult = await sendInvitationSMS(
      phone,
      smsAddress,
      contractorName,
      invitationUrl
    );

    if (!smsResult.success) {
      console.warn(
        `SMS failed for invitation ${invitation.id}:`,
        smsResult.error
      );
    }
  }

  return NextResponse.json(
    {
      invitation,
      homeCreated: homeWasCreated,
    },
    { status: 201 }
  );
}