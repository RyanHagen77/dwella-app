import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    // Verify transfer exists and is pending
    const transfer = await prisma.homeTransfer.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        homeId: true,
        fromUserId: true,
        recipientEmail: true,
        home: { select: { address: true } },
        fromUser: { select: { email: true, name: true } },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 }
      );
    }

    if (transfer.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending transfers can be cancelled" },
        { status: 400 }
      );
    }

    // Cancel the transfer
    await prisma.homeTransfer.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Log the action
    await logAdminAction({
      actorId: session.user.id,
      action: "TRANSFER_CANCELLED",
      entity: "HomeTransfer",
      entityId: id,
      homeId: transfer.homeId,
      diff: {
        homeAddress: transfer.home.address,
        fromUser: transfer.fromUser.email,
        toEmail: transfer.recipientEmail,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transfer cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling transfer:", error);
    return NextResponse.json(
      { error: "Failed to cancel transfer" },
      { status: 500 }
    );
  }
}