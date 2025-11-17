// app/api/home/[homeId]/records/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ homeId: string }> }
) {
  const { homeId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireHomeAccess(homeId, session.user.id);

  const records = await prisma.record.findMany({
    where: { homeId },
    orderBy: { date: "desc" },
    include: {
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true,
        },
      },
    },
  });

  return NextResponse.json({ records });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ homeId: string }> }
) {
  const { homeId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireHomeAccess(homeId, session.user.id);

  try {
    const body = await req.json();
    const { title, note, date, kind, vendor, cost, verified } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const record = await prisma.record.create({
      data: {
        homeId,
        title,
        note: note || null,
        ...(date && { date: new Date(date) }), // ✅ Conditionally include date
        kind: kind?.toLowerCase() || null,
        vendor: vendor || null,
        cost: cost != null ? Number(cost) : null,
        createdBy: session.user.id,
        verifiedBy: verified ? session.user.id : null,
        verifiedAt: verified ? new Date() : null,
      },
    });

    return NextResponse.json({ id: record.id, record });
  } catch (error) {
    console.error("Error creating record:", error);
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }
}