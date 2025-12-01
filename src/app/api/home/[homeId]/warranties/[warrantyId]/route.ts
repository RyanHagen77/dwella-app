import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ homeId: string; warrantyId: string }> }
) {
  const { homeId, warrantyId } = await ctx.params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requireHomeAccess(homeId, session.user.id);

  // Verify warranty belongs to this stats
  const existingWarranty = await prisma.warranty.findUnique({
    where: { id: warrantyId },
    select: { homeId: true },
  });

  if (!existingWarranty || existingWarranty.homeId !== homeId) {
    return NextResponse.json({ error: "Warranty not found" }, { status: 404 });
  }

  // Parse request body
  const body = await req.json();
  const { item, provider, policyNo, expiresAt, note } = body;

  // Parse date properly to avoid timezone issues
  let parsedDate: Date | null = null;
  if (expiresAt) {
    // If it's YYYY-MM-DD format, parse as local date at noon
    if (typeof expiresAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
      const [year, month, day] = expiresAt.split('-').map(Number);
      parsedDate = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      parsedDate = new Date(expiresAt);
    }
  }

  // Update the warranty
  const updatedWarranty = await prisma.warranty.update({
    where: { id: warrantyId },
    data: {
      item: item || undefined,
      provider: provider !== undefined ? provider : undefined,
      policyNo: policyNo !== undefined ? policyNo : undefined,
      expiresAt: parsedDate,
      note: note !== undefined ? note : undefined,
    },
  });

  return NextResponse.json(updatedWarranty);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ homeId: string; warrantyId: string }> }
) {
  const { homeId, warrantyId } = await ctx.params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireHomeAccess(homeId, session.user.id);

  await prisma.warranty.delete({ where: { id: warrantyId } });
  return NextResponse.json({ ok: true });
}