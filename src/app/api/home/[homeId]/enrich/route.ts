// src/app/api/stats/[homeId]/enrich/route.ts
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { NextResponse } from "next/server";

// later: call Estated/HouseCanary/ATTOM here and upsert fields/photos
export async function POST(_: Request, { params }: { params: { homeId: string } }) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireHomeAccess(params.homeId, session.user.id);

  // Placeholder: mark Enriched to flip the UI badge
  await prisma.home.update({
    where: { id: params.homeId },
    data: { meta: { set: { dataSource: "Enriched", enrichedAt: new Date().toISOString() } } }
  });

  return NextResponse.json({ ok: true });
}