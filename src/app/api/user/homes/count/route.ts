// src/app/api/user/stats/count/route.ts
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
    // Count stats where user is owner or has access
    const count = await prisma.home.count({
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
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to get stats count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}