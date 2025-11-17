// src/app/api/user/homes/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all homes where user is owner or has access
    const homes = await prisma.home.findMany({
      where: {
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
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        createdAt: true,
        // Get counts for dashboard
        _count: {
          select: {
            workRecords: true,
            reminders: true,
            warranties: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ homes });
  } catch (error) {
    console.error("Failed to get homes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}