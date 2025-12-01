import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      totalHomes,
      totalTransfers,
      pendingTransfers,
      pendingPros,
      activeConnections,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.home.count(),
      prisma.homeTransfer.count(),
      prisma.homeTransfer.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { role: "PRO", proStatus: "PENDING" } }),
      prisma.connection.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalHomes,
      totalTransfers,
      pendingTransfers,
      pendingPros,
      activeConnections,
      recentUsers,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}