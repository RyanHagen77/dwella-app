// app/api/pro/contractor/service-records/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createServiceRecordSchema = z.object({
  homeId: z.string().min(1, "Home ID is required"),
  serviceType: z.string().min(1, "Service type is required"),
  serviceDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  description: z.string().optional(),
  cost: z.number().nullable().optional(),
  warrantyIncluded: z.boolean().default(false),
  warrantyLength: z.string().optional(),
  warrantyDetails: z.string().optional(),
});

/**
 * POST /api/pro/contractor/service-records
 * Allows contractors to document completed work for connected stats
 */
export async function POST(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is a contractor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    return NextResponse.json(
      { error: "Only contractors can document completed work" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = createServiceRecordSchema.parse(body);

    // Verify contractor has access to this stats
    const connection = await prisma.connection.findFirst({
      where: {
        contractorId: session.user.id,
        homeId: data.homeId,
        status: "ACTIVE",
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "You don't have access to this property" },
        { status: 403 }
      );
    }

    // Get stats details for address snapshot
    const home = await prisma.home.findUnique({
      where: { id: data.homeId },
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        zip: true,
      },
    });

    if (!home) {
      return NextResponse.json(
        { error: "Home not found" },
        { status: 404 }
      );
    }

    // Create work record with correct status enum value
    const serviceRecord = await prisma.serviceRecord.create({
      data: {
        homeId: data.homeId,
        contractorId: session.user.id,
        serviceType: data.serviceType,
        serviceDate: new Date(data.serviceDate),
        description: data.description ?? null,
        // Convert cost to string for Prisma Decimal, or null if not provided
        cost: data.cost != null ? String(data.cost) : null,
        warrantyIncluded: data.warrantyIncluded,
        warrantyLength: data.warrantyLength ?? null,
        warrantyDetails: data.warrantyDetails ?? null,
        // Use DOCUMENTED_UNVERIFIED for contractor-submitted work awaiting homeowner review
        status: "DOCUMENTED_UNVERIFIED",
        isVerified: false,
        photos: [],
        invoiceUrl: null,
        // Store address snapshot for historical record
        addressSnapshot: {
          address: home.address,
          city: home.city,
          state: home.state,
          zip: home.zip,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        serviceRecord: {
          id: serviceRecord.id,
          homeId: home.id,
          status: serviceRecord.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating work record:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    // Log full Prisma error details
    if (error && typeof error === 'object') {
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }

    return NextResponse.json(
      { error: "Failed to create work record", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pro/contractor/service-records
 * List contractor's work records
 */
export async function GET(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("homeId");

  const serviceRecords = await prisma.serviceRecord.findMany({
    where: {
      contractorId: session.user.id,
      ...(homeId && { homeId }),
      archivedAt: null,
    },
    include: {
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      serviceDate: "desc",
    },
  });

  return NextResponse.json({ serviceRecords });
}