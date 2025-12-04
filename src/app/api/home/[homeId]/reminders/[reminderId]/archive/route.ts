import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export async function PATCH(
  _req: Request,
  {
    params,
  }: { params: { homeId: string; reminderId: string } }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { homeId, reminderId } = params;

  await requireHomeAccess(homeId, session.user.id);

  const updated = await prisma.reminder.update({
    where: { id: reminderId },
    data: { archivedAt: new Date() },
    select: { id: true, archivedAt: true },
  });

  return NextResponse.json(updated);
}