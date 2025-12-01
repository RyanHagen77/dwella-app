/**
 * UPDATE HOME STATS
 *
 * PATCH /api/stats/[homeId]/stats
 * Updates stats statistics (health score, value, beds, baths, sqft, year built)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export const runtime = "nodejs";

type RouteParams = { homeId: string };

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { homeId } = await params;

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireHomeAccess(homeId, session.user.id);

    const body = await request.json();
    const { healthScore, estValue, beds, baths, sqft, yearBuilt } = body;

    // Get current stats to preserve other meta data
    const currentHome = await prisma.home.findUnique({
      where: { id: homeId },
      select: { meta: true },
    });

    const currentMeta = (currentHome?.meta as any) || {};

    // Update the meta.attrs with new stats
    const updatedMeta = {
      ...currentMeta,
      attrs: {
        ...(currentMeta.attrs || {}),
        healthScore: healthScore !== null ? Number(healthScore) : null,
        estValue: estValue !== null ? Number(estValue) : null,
        beds: beds !== null ? Number(beds) : null,
        baths: baths !== null ? Number(baths) : null,
        sqft: sqft !== null ? Number(sqft) : null,
        yearBuilt: yearBuilt !== null ? Number(yearBuilt) : null,
        lastUpdated: new Date().toISOString(),
      },
    };

    const updatedHome = await prisma.home.update({
      where: { id: homeId },
      data: {
        meta: updatedMeta,
      },
    });

    return NextResponse.json({ home: updatedHome });
  } catch (error) {
    console.error("Error updating stats stats:", error);
    return NextResponse.json(
      { error: "Failed to update stats stats" },
      { status: 500 }
    );
  }
}