import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ homeId: string; recordId: string }> }
) {
  const { homeId, recordId } = await params;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check stats access
    await requireHomeAccess(homeId, session.user.id);

    // Verify record belongs to this stats
    const existingRecord = await prisma.record.findUnique({
      where: { id: recordId },
      select: { homeId: true },
    });

    if (!existingRecord || existingRecord.homeId !== homeId) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { title, date, kind, vendor, cost, note } = body;

    // Update the record
    const updatedRecord = await prisma.record.update({
      where: { id: recordId },
      data: {
        title: title || undefined,
        date: date ? new Date(date) : undefined,
        kind: kind || undefined,
        vendor: vendor || undefined,
        cost: cost != null ? Number(cost) : undefined,
        note: note || undefined,
      },
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error("Failed to update record:", error);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ homeId: string; recordId: string }> }
) {
  const { homeId, recordId } = await params;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check stats access
    await requireHomeAccess(homeId, session.user.id);

    // Verify record belongs to this stats
    const existingRecord = await prisma.record.findUnique({
      where: { id: recordId },
      select: { homeId: true },
    });

    if (!existingRecord || existingRecord.homeId !== homeId) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Delete the record (attachments will cascade delete if configured)
    await prisma.record.delete({
      where: { id: recordId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete record:", error);
    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 }
    );
  }
}