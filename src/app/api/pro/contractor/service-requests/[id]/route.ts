/**
 * INDIVIDUAL JOB REQUEST API (CONTRACTOR)
 *
 * GET /api/pro/contractor/service-requests/[workId] - Get single job request
 * PATCH /api/pro/contractor/service-requests/[workId] - Update job request (respond, decline, etc.)
 *
 * Location: app/api/pro/contractor/service-requests/[workId]/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
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

    if (session.user.role !== "PRO") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const userId = session.user.id;

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        home: {
          select: {
            id: true,
            address: true,
            addressLine2: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        homeowner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        connection: {
          select: {
            id: true,
            notes: true,
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

    // Verify this job request is for this contractor
    if (serviceRequest.contractorId !== userId) {
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

// PATCH - Update job request (contractor responds)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PRO") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
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

    // Verify this job request is for this contractor
    if (existing.contractorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Prisma.ServiceRequestUpdateInput = {};

    // Contractor can update: status, contractorNotes, respondedAt
    if (body.status) {
      // Validate contractor can set these statuses
      const allowedStatuses = ["DECLINED", "IN_PROGRESS", "COMPLETED"];
      if (allowedStatuses.includes(body.status)) {
        updateData.status = body.status;
        updateData.respondedAt = new Date();
      }
    }

    if (body.contractorNotes !== undefined) {
      updateData.contractorNotes = body.contractorNotes;
    }

    // Update job request
    const serviceRequest = await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
      include: {
        home: {
          select: {
            address: true,
            city: true,
            state: true,
          },
        },
        homeowner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send notification to homeowner on status change

    return NextResponse.json({ serviceRequest });
  } catch (error) {
    console.error("Error updating job request:", error);
    return NextResponse.json(
      { error: "Failed to update service request" },
      { status: 500 }
    );
  }
}