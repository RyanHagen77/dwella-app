// app/api/pro/contractor/work-records/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createWorkRecordSchema = z.object({
  homeId: z.string().min(1, "Home ID is required"), // ✅ Accept homeId for connected homes
  workType: z.string().min(1, "Work type is required"),
  workDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  description: z.string().optional(),
  cost: z.number().nullable().optional(),
  warrantyIncluded: z.boolean().default(false),
  warrantyLength: z.string().optional(),
  warrantyDetails: z.string().optional(),
});

/**
 * POST /api/pro/contractor/work-records
 * Allows contractors to document work for connected homes
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
      { error: "Only contractors can document work" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = createWorkRecordSchema.parse(body);

    // Verify contractor has access to this home
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

    // Get home details
    const home = await prisma.home.findUnique({
      where: { id: data.homeId },
    });

    if (!home) {
      return NextResponse.json(
        { error: "Home not found" },
        { status: 404 }
      );
    }

    // Create work record
    const workRecord = await prisma.workRecord.create({
      data: {
        homeId: data.homeId,
        contractorId: session.user.id,
        invitationId: null,
        workType: data.workType,
        workDate: new Date(data.workDate),
        description: data.description ?? null,
        cost: data.cost ?? null,
        warrantyIncluded: data.warrantyIncluded,
        warrantyLength: data.warrantyLength ?? null,
        warrantyDetails: data.warrantyDetails ?? null,
        status: "DOCUMENTED_UNVERIFIED",
        isVerified: false,
        photos: [],
        invoiceUrl: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        workRecord: {
          id: workRecord.id,
          homeId: home.id,
          status: workRecord.status,
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

    return NextResponse.json(
      { error: "Failed to create work record" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pro/contractor/work-records
 * List contractor's work records
 */
export async function GET(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("homeId");

  const workRecords = await prisma.workRecord.findMany({
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
      workDate: "desc",
    },
  });

  return NextResponse.json({ workRecords });
}