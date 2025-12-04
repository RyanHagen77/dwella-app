import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ homeId: string; reminderId: string }> }
) {
  const { homeId, reminderId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Make sure this user can access this home
  await requireHomeAccess(homeId, session.user.id);

  // Make sure the reminder belongs to this home
  const existing = await prisma.reminder.findFirst({
    where: {
      id: reminderId,
      homeId,
      deletedAt: null,
    },
    select: { id: true, archivedAt: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
  }

  const updated = await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      archivedAt: new Date(),
    },
    select: {
      id: true,
      archivedAt: true,
    },
  });

  return NextResponse.json({ reminder: updated });
}