/**
 * JOB REQUESTS API
 *
 * POST /api/job-requests - Create new job request (homeowner)
 * GET /api/job-requests - List job requests (filtered by role)
 *
 * Location: app/api/job-requests/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List job requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const { searchParams } = new URL(request.url);
    const homeId = searchParams.get("homeId");
    const status = searchParams.get("status");

    // CONTRACTORS: Get job requests sent TO them
    if (userRole === "PRO") {
      const where: any = {
        contractorId: userId,
      };

      if (status) {
        where.status = status;
      }

      const jobRequests = await prisma.jobRequest.findMany({
        where,
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
              image: true,
            },
          },
          quote: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ jobRequests });
    }

    // HOMEOWNERS: Get job requests they sent
    let where: any = {
      homeownerId: userId,
    };

    if (homeId) {
      where.homeId = homeId;
    }

    if (status) {
      where.status = status;
    }

    const jobRequests = await prisma.jobRequest.findMany({
      where,
      include: {
        home: {
          select: {
            address: true,
            city: true,
            state: true,
          },
        },
        contractor: {
          select: {
            name: true,
            email: true,
            image: true,
            proProfile: {
              select: {
                businessName: true,
              },
            },
          },
        },
        quote: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ jobRequests });
  } catch (error) {
    console.error("Error fetching job requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch job requests" },
      { status: 500 }
    );
  }
}

// POST - Create new job request (homeowner only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "PRO") {
      return NextResponse.json(
        { error: "Contractors cannot create job requests" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      connectionId,
      homeId,
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
    if (!connectionId || !homeId || !contractorId || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify homeowner owns the stats
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
    const jobRequest = await prisma.jobRequest.create({
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
            name: true,
            email: true,
            proProfile: {
              select: {
                businessName: true,
              },
            },
          },
        },
        home: {
          select: {
            address: true,
            city: true,
            state: true,
          },
        },
      },
    });

    // TODO: Send notification to contractor

    return NextResponse.json({ jobRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating job request:", error);
    return NextResponse.json(
      { error: "Failed to create job request" },
      { status: 500 }
    );
  }
}