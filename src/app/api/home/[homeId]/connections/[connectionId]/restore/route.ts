// =============================================================================
// app/api/home/[homeId]/connections/[connectionId]/restore/route.ts
// =============================================================================
// POST: Restore an archived connection

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { sendReconnectNotificationEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ homeId: string; connectionId: string }> }
) {
  try {
    const { homeId, connectionId } = await params;
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireHomeAccess(homeId, session.user.id);

    // First check if user is the current home owner
    const home = await prisma.home.findUnique({
      where: { id: homeId },
      select: { ownerId: true },
    });

    if (!home || home.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the homeowner can restore a connection" },
        { status: 403 }
      );
    }

    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionId,
        homeId: homeId,
        status: "ARCHIVED",
      },
      select: {
        id: true,
        homeownerId: true,
        contractor: {
          select: {
            id: true,
            name: true,
            email: true,
            proProfile: {
              select: {
                businessName: true,
              },
            },
          },
        },
        home: {
          select: {
            address: true,
            city: true,
            state: true,
          },
        },
        homeowner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    await prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: "ACTIVE",
        archivedAt: null,
        updatedAt: new Date(),
      },
    });

    // Send email notification to contractor
    if (connection.contractor?.email) {
      const homeAddress = [
        connection.home.address,
        connection.home.city,
        connection.home.state,
      ]
        .filter(Boolean)
        .join(", ");

      // Use current user's name since they're restoring the connection
      const homeownerName = session.user.name || "A homeowner";
      const contractorName =
        connection.contractor.proProfile?.businessName ||
        connection.contractor.name ||
        "";

      try {
        await sendReconnectNotificationEmail({
          to: connection.contractor.email,
          contractorName,
          homeownerName,
          homeAddress,
        });
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error("Failed to send reconnect notification email:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error restoring connection:", error);
    return NextResponse.json(
      { error: "Failed to restore connection" },
      { status: 500 }
    );
  }
}