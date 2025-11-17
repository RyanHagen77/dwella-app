// src/app/api/user/last-home/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { homeId } = await req.json();

    if (!homeId || typeof homeId !== "string") {
      return NextResponse.json({ error: "homeId is required" }, { status: 400 });
    }

    // Verify user has access to this home
    const home = await prisma.home.findFirst({
      where: {
        id: homeId,
        OR: [
          { ownerId: session.user.id },
          {
            access: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
    });

    if (!home) {
      return NextResponse.json({ error: "Home not found or access denied" }, { status: 404 });
    }

    // Update user's lastHomeId
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastHomeId: homeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update last home:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}