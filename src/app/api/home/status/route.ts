// src/app/api/stats/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({ claimed: false });

  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastHomeId: true },
  });

  let homeId = user?.lastHomeId ?? null;

  if (!homeId) {
    const first = await prisma.home.findFirst({
      where: { ownerId: userId },
      select: { id: true },
      orderBy: { id: "asc" },
    });
    homeId = first?.id ?? null;
  }

  return NextResponse.json({ claimed: !!homeId, homeId });
}