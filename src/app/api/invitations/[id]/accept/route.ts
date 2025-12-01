// app/api/invitations/[workId]/accept/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvitationStatus } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userEmail = session.user.email.toLowerCase();

  // Parse the verified address from the request body
  let verifiedAddress: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };

  try {
    const body = await req.json();
    verifiedAddress = {
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
    };

    if (!verifiedAddress.address || !verifiedAddress.city || !verifiedAddress.state || !verifiedAddress.zip) {
      return NextResponse.json(
        { error: "Address verification required" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: {
      inviter: {
        select: {
          id: true,
          email: true,
        },
      },
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          normalizedAddress: true,
        },
      },
    },
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

  if (!invitation.homeId || !invitation.home) {
    return NextResponse.json(
      { error: "Invitation has no stats associated" },
      { status: 400 }
    );
  }

  // ---- VALIDATE: Verified address must match the invitation's stats ----
  const normalizedVerified = `${verifiedAddress.address}${verifiedAddress.city}${verifiedAddress.state}${verifiedAddress.zip}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const invitationNormalized = invitation.home.normalizedAddress;

  if (normalizedVerified !== invitationNormalized) {
    return NextResponse.json(
      {
        error: "Address mismatch. The verified address does not match the property in this invitation.",
        expected: {
          address: invitation.home.address,
          city: invitation.home.city,
          state: invitation.home.state,
          zip: invitation.home.zip,
        },
        provided: verifiedAddress,
      },
      { status: 400 }
    );
  }

  // Update invitation status
  const updated = await prisma.invitation.update({
    where: { id },
    data: { status: InvitationStatus.ACCEPTED },
  });

  // Create Connection based on invitation role
  if (invitation.role === "PRO") {
    // Homeowner invited a Pro
    await prisma.connection.create({
      data: {
        homeId: invitation.homeId,
        homeownerId: invitation.invitedBy,
        contractorId: session.user.id,
        invitedBy: invitation.invitedBy,
        status: "ACTIVE",
      },
    });
  } else if (invitation.role === "HOMEOWNER") {
    // Pro invited a Homeowner
    await prisma.connection.create({
      data: {
        homeId: invitation.homeId,
        homeownerId: session.user.id,
        contractorId: invitation.invitedBy,
        invitedBy: invitation.invitedBy,
        status: "ACTIVE",
      },
    });
  }

  return NextResponse.json({ invitation: updated }, { status: 200 });
}