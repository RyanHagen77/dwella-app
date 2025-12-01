/**
 * PER-HOME UNREAD MESSAGES COUNT
 *
 * Endpoint: /api/stats/[homeId]/messages/unread
 *
 * GET - Returns unread message count for a specific stats
 *
 * Returns:
 * {
 *   total: 3,  // unread messages for THIS stats only
 * }
 *
 * Location: app/api/stats/[homeId]/messages/unread/route.ts
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ homeId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { homeId } = await params;
    const userId = session.user.id;

    // Verify user owns this stats
    const home = await prisma.home.findFirst({
      where: {
        id: homeId,
        ownerId: userId,
      },
    });

    if (!home) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all active connections for THIS stats
    const connections = await prisma.connection.findMany({
      where: {
        homeId,
        homeownerId: userId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    const connectionIds = connections.map((c) => c.id);

    // No active connections = no unread messages
    if (connectionIds.length === 0) {
      return NextResponse.json({ total: 0 });
    }

    // Count total unread messages for this stats
    const totalUnread = await prisma.message.count({
      where: {
        connectionId: { in: connectionIds },
        senderId: { not: userId },
        reads: {
          none: {
            userId,
          },
        },
      },
    });

    return NextResponse.json({ total: totalUnread });
  } catch (error) {
    console.error("Error fetching per-stats unread count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}