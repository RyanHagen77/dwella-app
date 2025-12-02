/**
 * INDIVIDUAL JOB REQUEST API (HOMEOWNER)
 *
 * GET /api/stats/[homeId]/service-requests/[workId] - Get single job request
 * PATCH /api/stats/[homeId]/service-requests/[workId] - Update job request (accept quote, cancel, etc.)
 * DELETE /api/stats/[homeId]/service-requests/[workId] - Delete/cancel job request
 *
 * Location: app/api/stats/[homeId]/service-requests/[workId]/route.ts
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

    const serviceRequest = await prisma.serviceRequest.findUnique({
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

    if (!serviceRequest) {
      return NextResponse.json(
        { error: "Job request not found" },
        { status: 404 }
      );
    }

    // Verify this job request belongs to this stats
    if (serviceRequest.homeId !== homeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify homeowner owns this request
    if (serviceRequest.homeownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Serialize Decimal fields for JSON response
    const serialized = {
      ...serviceRequest,
      budgetMin: serviceRequest.budgetMin ? Number(serviceRequest.budgetMin) : null,
      budgetMax: serviceRequest.budgetMax ? Number(serviceRequest.budgetMax) : null,
      connection: serviceRequest.connection
        ? {
            ...serviceRequest.connection,
            totalSpent: Number(serviceRequest.connection.totalSpent),
          }
        : null,
      quote: serviceRequest.quote
        ? {
            ...serviceRequest.quote,
            totalAmount: Number(serviceRequest.quote.totalAmount),
            items: serviceRequest.quote.items.map((item) => ({
              ...item,
              qty: Number(item.qty),
              unitPrice: Number(item.unitPrice),
              total: Number(item.total),
            })),
          }
        : null,
      workRecord: serviceRequest.workRecord
        ? {
            ...serviceRequest.workRecord,
            cost: serviceRequest.workRecord.cost
              ? Number(serviceRequest.workRecord.cost)
              : null,
          }
        : null,
    };

    return NextResponse.json({ serviceRequest: serialized });
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
    const existing = await prisma.serviceRequest.findUnique({
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

    const updateData: Prisma.ServiceRequestUpdateInput = {};

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
    const serviceRequest = await prisma.serviceRequest.update({
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

    return NextResponse.json({ serviceRequest });
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

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: "Job request not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (serviceRequest.homeId !== homeId || serviceRequest.homeownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only delete if still pending or declined
    if (!["PENDING", "DECLINED", "CANCELLED"].includes(serviceRequest.status)) {
      return NextResponse.json(
        { error: "Cannot delete job request in this status" },
        { status: 400 }
      );
    }

    await prisma.serviceRequest.delete({
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