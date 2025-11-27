// =============================================================================
// app/api/home/[homeId]/connections/[connectionId]/route.ts
// =============================================================================
// DELETE: Archive a connection (disconnect from contractor)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { sendDisconnectNotificationEmail } from "@/lib/email";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ homeId: string; connectionId: string }> }
) {
  try {
    const { homeId, connectionId } = await params;
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this home
    await requireHomeAccess(homeId, session.user.id);

    // Check if user is the current home owner
    const home = await prisma.home.findUnique({
      where: { id: homeId },
      select: { ownerId: true },
    });

    if (!home || home.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the homeowner can disconnect from a contractor" },
        { status: 403 }
      );
    }

    // Verify the connection exists and belongs to this home
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionId,
        homeId: homeId,
      },
      select: {
        id: true,
        homeownerId: true,
        status: true,
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

    // Update connection status to ARCHIVED and cancel pending job requests
    await prisma.$transaction(async (tx) => {
      // Archive the connection
      await tx.connection.update({
        where: { id: connectionId },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Cancel any pending job requests with this contractor for this home
      await tx.jobRequest.updateMany({
        where: {
          homeId: homeId,
          connectionId: connectionId,
          status: {
            in: ["PENDING", "QUOTED"],
          },
        },
        data: {
          status: "CANCELLED",
          updatedAt: new Date(),
        },
      });
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

      // Use current user's name since they're doing the disconnect
      const homeownerName = session.user.name || "A homeowner";
      const contractorName =
        connection.contractor.proProfile?.businessName ||
        connection.contractor.name ||
        "";

      try {
        await sendDisconnectNotificationEmail({
          to: connection.contractor.email,
          contractorName,
          homeownerName,
          homeAddress,
        });
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error("Failed to send disconnect notification email:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting from contractor:", error);
    return NextResponse.json(
      { error: "Failed to disconnect from contractor" },
      { status: 500 }
    );
  }
}