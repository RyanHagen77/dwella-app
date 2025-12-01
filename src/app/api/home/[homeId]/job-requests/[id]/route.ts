/**
 * INDIVIDUAL JOB REQUEST API (HOMEOWNER)
 *
 * GET /api/stats/[homeId]/job-requests/[workId] - Get single job request
 * PATCH /api/stats/[homeId]/job-requests/[workId] - Update job request (accept quote, cancel, etc.)
 * DELETE /api/stats/[homeId]/job-requests/[workId] - Delete/cancel job request
 *
 * Location: app/api/stats/[homeId]/job-requests/[workId]/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ homeId: string; id: string }>;
};

// GET - Get single job request
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { homeId, id } = await context.params;
    await requireHomeAccess(homeId, session.user.id);

    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id },
      include: {
        home: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            proProfile: {
              select: {
                businessName: true,
                company: true,
                phone: true,
                verified: true,
                rating: true,
              },
            },
          },
        },
        connection: {
          select: {
            id: true,
            verifiedWorkCount: true,
            totalSpent: true,
            lastWorkDate: true,
          },
        },
        quote: {
          include: {
            items: true,
          },
        },
        workRecord: {
          select: {
            id: true,
            workType: true,
            workDate: true,
            status: true,
            cost: true,
          },
        },
        attachments: {
          select: {
            id: true,
            url: true,
            filename: true,
            mimeType: true,
          },
        },
      },
    });

    if (!jobRequest) {
      return NextResponse.json(
        { error: "Job request not found" },
        { status: 404 }
      );
    }

    // Verify this job request belongs to this stats
    if (jobRequest.homeId !== homeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify homeowner owns this request
    if (jobRequest.homeownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Serialize Decimal fields for JSON response
    const serialized = {
      ...jobRequest,
      budgetMin: jobRequest.budgetMin ? Number(jobRequest.budgetMin) : null,
      budgetMax: jobRequest.budgetMax ? Number(jobRequest.budgetMax) : null,
      connection: jobRequest.connection
        ? {
            ...jobRequest.connection,
            totalSpent: Number(jobRequest.connection.totalSpent),
          }
        : null,
      quote: jobRequest.quote
        ? {
            ...jobRequest.quote,
            totalAmount: Number(jobRequest.quote.totalAmount),
            items: jobRequest.quote.items.map((item) => ({
              ...item,
              qty: Number(item.qty),
              unitPrice: Number(item.unitPrice),
              total: Number(item.total),
            })),
          }
        : null,
      workRecord: jobRequest.workRecord
        ? {
            ...jobRequest.workRecord,
            cost: jobRequest.workRecord.cost
              ? Number(jobRequest.workRecord.cost)
              : null,
          }
        : null,
    };

    return NextResponse.json({ jobRequest: serialized });
  } catch (error) {
    console.error("Error fetching job request:", error);
    return NextResponse.json(
      { error: "Failed to fetch job request" },
      { status: 500 }
    );
  }
}

// PATCH - Update job request (homeowner actions)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { homeId, id } = await context.params;
    await requireHomeAccess(homeId, session.user.id);

    const userId = session.user.id;
    const body = await request.json();

    // Get existing job request
    const existing = await prisma.jobRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Job request not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existing.homeId !== homeId || existing.homeownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Prisma.JobRequestUpdateInput = {};

    // Homeowner can update: status (cancel/accept), title, description, etc.
    if (body.status) {
      // Validate homeowner can set these statuses
      const allowedStatuses = ["CANCELLED", "ACCEPTED"];
      if (allowedStatuses.includes(body.status)) {
        updateData.status = body.status;
      }
    }

    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.category) updateData.category = body.category;
    if (body.urgency) updateData.urgency = body.urgency;
    if (body.budgetMin !== undefined)
      updateData.budgetMin = body.budgetMin ? parseFloat(body.budgetMin) : null;
    if (body.budgetMax !== undefined)
      updateData.budgetMax = body.budgetMax ? parseFloat(body.budgetMax) : null;
    if (body.desiredDate !== undefined)
      updateData.desiredDate = body.desiredDate ? new Date(body.desiredDate) : null;
    if (body.photos !== undefined) {
      updateData.photos = body.photos;
    }

    // Update job request
    const jobRequest = await prisma.jobRequest.update({
      where: { id },
      data: updateData,
      include: {
        contractor: {
          select: {
            name: true,
            email: true,
            proProfile: {
              select: {
                businessName: true,
              },
            },
          },
        },
      },
    });

    // TODO: Send notifications on status changes

    return NextResponse.json({ jobRequest });
  } catch (error) {
    console.error("Error updating job request:", error);
    return NextResponse.json(
      { error: "Failed to update job request" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/delete job request
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { homeId, id } = await context.params;
    await requireHomeAccess(homeId, session.user.id);

    const userId = session.user.id;

    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id },
    });

    if (!jobRequest) {
      return NextResponse.json(
        { error: "Job request not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (jobRequest.homeId !== homeId || jobRequest.homeownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only delete if still pending or declined
    if (!["PENDING", "DECLINED", "CANCELLED"].includes(jobRequest.status)) {
      return NextResponse.json(
        { error: "Cannot delete job request in this status" },
        { status: 400 }
      );
    }

    await prisma.jobRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job request:", error);
    return NextResponse.json(
      { error: "Failed to delete job request" },
      { status: 500 }
    );
  }
}