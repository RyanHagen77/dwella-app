import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export const runtime = "nodejs";

function parseDateOnly(expiresAt: unknown): Date | null {
  if (!expiresAt) return null;

  if (typeof expiresAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
    const [year, month, day] = expiresAt.split("-").map(Number);
    // local noon avoids DST edge cases
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  const d = new Date(expiresAt as any);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ homeId: string; warrantyId: string }> }
) {
  const { homeId, warrantyId } = await ctx.params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireHomeAccess(homeId, session.user.id);

  // Verify warranty belongs to this home (and optionally limit editing)
  const existing = await prisma.warranty.findUnique({
    where: { id: warrantyId },
    select: { id: true, homeId: true, status: true },
  });

  if (!existing || existing.homeId !== homeId) {
    return NextResponse.json({ error: "Warranty not found" }, { status: 404 });
  }

  // Optional guard: prevent editing contractor-created pending warranties
  if (existing.status === "PENDING") {
    return NextResponse.json(
      { error: "Pending warranties must be accepted before editing." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { item, provider, policyNo, expiresAt, note } = body as {
    item?: string;
    provider?: string | null;
    policyNo?: string | null;
    expiresAt?: string | null;
    note?: string | null;
  };

  const parsedDate = parseDateOnly(expiresAt);

  const updated = await prisma.warranty.update({
    where: { id: warrantyId },
    data: {
      ...(typeof item === "string" ? { item } : {}),
      ...(provider !== undefined ? { provider } : {}),
      ...(policyNo !== undefined ? { policyNo } : {}),
      ...(expiresAt !== undefined ? { expiresAt: parsedDate } : {}),
      ...(note !== undefined ? { note } : {}),
    },
  });

  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ homeId: string; warrantyId: string }> }
) {
  const { homeId, warrantyId } = await ctx.params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireHomeAccess(homeId, session.user.id);

  // Verify ownership before deleting (IMPORTANT)
  const existing = await prisma.warranty.findUnique({
    where: { id: warrantyId },
    select: { homeId: true },
  });

  if (!existing || existing.homeId !== homeId) {
    return NextResponse.json({ error: "Warranty not found" }, { status: 404 });
  }

  // Prefer soft-delete if you want audit/history:
  // await prisma.warranty.update({ where: { id: warrantyId }, data: { deletedAt: new Date() } });

  await prisma.warranty.delete({ where: { id: warrantyId } });

  return NextResponse.json({ ok: true }, { status: 200 });
}