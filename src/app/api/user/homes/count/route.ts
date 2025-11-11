// src/app/api/user/homes/count/route.ts
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
    // Count homes where user is owner or has access
    const count = await prisma.home.count({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            homeAccess: {
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
    console.error("Failed to get home count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}