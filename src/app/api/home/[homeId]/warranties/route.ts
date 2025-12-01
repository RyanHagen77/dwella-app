// src/app/api/stats/[homeId]/warranties/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { WarrantySchema } from "@/lib/validators";

export const runtime = "nodejs";
type Params = { homeId: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { homeId } = await ctx.params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireHomeAccess(homeId, session.user.id);

  const warranties = await prisma.warranty.findMany({
    where: { homeId },
    orderBy: [{ expiresAt: "asc" }],
  });
  return NextResponse.json(warranties, { status: 200 });
}

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { homeId } = await ctx.params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireHomeAccess(homeId, session.user.id);

  const body = await req.json().catch(() => null);
  const parsed = WarrantySchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) {
      const key = i.path.join(".") || "_form";
      (fieldErrors[key] ||= []).push(i.message);
    }
    return NextResponse.json({ error: { fieldErrors } }, { status: 400 });
  }
    const { item, provider, policyNo, expiresAt, note } = parsed.data;

  const created = await prisma.warranty.create({
    data: {
      homeId,
      item,
      provider: provider ?? null,
      policyNo: policyNo ?? null,
      expiresAt: expiresAt ? new Date(`${expiresAt}T00:00:00.000Z`) : null,
      note: note ?? null,                 // <- NEW
      createdBy: session.user.id ?? null, // audit
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}