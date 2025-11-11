import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ homeId: string; reminderId: string }> }
) {
  const { homeId, reminderId } = await params;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check home access
    await requireHomeAccess(homeId, session.user.id);

    // Verify reminder belongs to this home
    const existingReminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      select: { homeId: true },
    });

    if (!existingReminder || existingReminder.homeId !== homeId) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { title, dueAt, note } = body;

    // Parse date properly to avoid timezone issues
    let parsedDate: Date | undefined;
    if (dueAt) {
      // If it's YYYY-MM-DD format, parse as local date at noon
      if (typeof dueAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueAt)) {
        const [year, month, day] = dueAt.split('-').map(Number);
        parsedDate = new Date(year, month - 1, day, 12, 0, 0);
      } else {
        parsedDate = new Date(dueAt);
      }
    }

    // Update the reminder
    const updatedReminder = await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        title: title || undefined,
        dueAt: parsedDate,
        note: note !== undefined ? note : undefined,
      },
    });

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error("Failed to update reminder:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ homeId: string; reminderId: string }> }
) {
  const { homeId, reminderId } = await params;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check home access
    await requireHomeAccess(homeId, session.user.id);

    // Verify reminder belongs to this home
    const existingReminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      select: { homeId: true },
    });

    if (!existingReminder || existingReminder.homeId !== homeId) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    // Delete the reminder
    await prisma.reminder.delete({
      where: { id: reminderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}