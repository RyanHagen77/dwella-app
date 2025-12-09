/**
 * HOMEOWNER REQUESTED JOBS API
 *
 * GET /api/stats/[homeId]/service-requests - List service requests for this stats
 * POST /api/stats/[homeId]/service-requests - Create new service request
 *
 * Location: app/api/stats/[homeId]/service-requests/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

type RouteParams = { homeId: string };

// GET - List service requests for this stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { homeId } = await params;

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireHomeAccess(homeId, session.user.id);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.ServiceRequestWhereInput = {
      homeId,
      homeownerId: session.user.id,
    };

    if (status) {
      where.status = status as Prisma.EnumServiceRequestStatusFilter;
    }

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      include: {
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
            verifiedServiceCount: true,
            totalSpent: true,
          },
        },
        quote: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            expiresAt: true,
          },
        },
        serviceRecord: {
          select: {
            id: true,
            status: true,
            serviceDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ serviceRequests });
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch service requests" },
      { status: 500 }
    );
  }
}

// POST - Create new job request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { homeId } = await params;

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "PRO") {
      return NextResponse.json(
        { error: "Contractors cannot create service requests" },
        { status: 403 }
      );
    }

    await requireHomeAccess(homeId, session.user.id);

    const userId = session.user.id;
    const body = await request.json();

    const {
      connectionId,
      contractorId,
      title,
      description,
      category,
      urgency = "NORMAL",
      budgetMin,
      budgetMax,
      desiredDate,
      photos = [],
    } = body;

    // Validate required fields
    if (!connectionId || !contractorId || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify stats belongs to user
    const home = await prisma.home.findFirst({
      where: {
        id: homeId,
        ownerId: userId,
      },
    });

    if (!home) {
      return NextResponse.json(
        { error: "Home not found or unauthorized" },
        { status: 404 }
      );
    }

    // Verify connection exists and is active
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionId,
        homeId,
        contractorId,
        homeownerId: userId,
        status: "ACTIVE",
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Active connection not found" },
        { status: 404 }
      );
    }

    // Create job request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        connectionId,
        homeId,
        homeownerId: userId,
        contractorId,
        title,
        description,
        category,
        urgency,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        desiredDate: desiredDate ? new Date(desiredDate) : null,
        photos,
        status: "PENDING",
      },
      include: {
        contractor: {
          select: {
            id: true,
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

    // TODO: Send notification to contractor

    return NextResponse.json({ serviceRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating job request:", error);
    return NextResponse.json(
      { error: "Failed to create job request" },
      { status: 500 }
    );
  }
}