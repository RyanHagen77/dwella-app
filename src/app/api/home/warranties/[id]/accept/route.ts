import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const warranty = await prisma.warranty.findUnique({
    where: { id },
    include: { home: { select: { id: true, ownerId: true } } },
  });
  if (!warranty) return NextResponse.json({ error: "Warranty not found" }, { status: 404 });

  const hasAccess =
    warranty.home.ownerId === session.user.id ||
    (await prisma.homeAccess.findFirst({
      where: { homeId: warranty.homeId, userId: session.user.id },
      select: { id: true },
    }));

  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (warranty.status !== "PENDING") {
    return NextResponse.json({ error: "Warranty is not pending" }, { status: 400 });
  }

  const updated = await prisma.warranty.update({
    where: { id },
    data: {
      status: "ACTIVE",
      acceptedBy: session.user.id,
      acceptedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, warranty: updated });
}