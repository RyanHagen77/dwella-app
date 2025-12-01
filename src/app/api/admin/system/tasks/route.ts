import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const { task } = await request.json();

    if (!task) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    let result: { success: boolean; message: string; affected?: number };

    switch (task) {
      case "expire-transfers": {
        // Mark expired pending transfers as EXPIRED
        const updated = await prisma.homeTransfer.updateMany({
          where: {
            status: "PENDING",
            expiresAt: { lt: new Date() },
          },
          data: { status: "EXPIRED" },
        });

        result = {
          success: true,
          message: `Marked ${updated.count} transfers as expired`,
          affected: updated.count,
        };
        break;
      }

      case "cleanup-cancelled": {
        // Delete cancelled transfers older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deleted = await prisma.homeTransfer.deleteMany({
          where: {
            status: "CANCELLED",
            createdAt: { lt: thirtyDaysAgo },
          },
        });

        result = {
          success: true,
          message: `Deleted ${deleted.count} old cancelled transfers`,
          affected: deleted.count,
        };
        break;
      }

      case "refresh-stats": {
        // This would refresh any cached statistics
        // For now, just return success since we're using live queries
        result = {
          success: true,
          message: "Statistics refreshed",
          affected: 0,
        };
        break;
      }

      case "send-reminders": {
        // Find old pending transfers and send reminder emails
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const oldTransfers = await prisma.homeTransfer.findMany({
          where: {
            status: "PENDING",
            createdAt: { lt: sevenDaysAgo },
          },
          select: {
            id: true,
            recipientEmail: true,
            fromUser: { select: { name: true, email: true } },
            home: { select: { address: true } },
          },
        });

        // TODO: Send actual reminder emails via Resend
        // for (const transfer of oldTransfers) {
        //   await sendTransferReminderEmail(transfer);
        // }

        result = {
          success: true,
          message: `Would send ${oldTransfers.length} reminder emails (not implemented)`,
          affected: oldTransfers.length,
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: "Unknown task" },
          { status: 400 }
        );
    }

    // Log the action
    await logAdminAction({
      actorId: session.user.id,
      action: "SYSTEM_TASK_RUN",
      entity: "System",
      entityId: task,
      diff: result,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error running system task:", error);
    return NextResponse.json(
      { error: "Failed to run task" },
      { status: 500 }
    );
  }
}