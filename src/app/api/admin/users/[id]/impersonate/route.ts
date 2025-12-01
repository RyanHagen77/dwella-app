import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't allow impersonating other admins
    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot impersonate admin users" },
        { status: 403 }
      );
    }

    // Log the impersonation
    await logAdminAction({
      actorId: session.user.id,
      action: "USER_IMPERSONATED",
      entity: "User",
      entityId: id,
      diff: {
        targetEmail: targetUser.email,
        targetName: targetUser.name,
      },
    });

    // In a real implementation, you would:
    // 1. Create a special impersonation session token
    // 2. Set it as a cookie
    // 3. Store the original admin session to allow "returning"

    // For now, return success - the actual session switching
    // would need to be implemented based on your auth setup
    return NextResponse.json({
      success: true,
      message: `Impersonation session created for ${targetUser.email}`,
      // You would include the session token here
    });
  } catch (error) {
    console.error("Error impersonating user:", error);
    return NextResponse.json(
      { error: "Failed to impersonate user" },
      { status: 500 }
    );
  }
}