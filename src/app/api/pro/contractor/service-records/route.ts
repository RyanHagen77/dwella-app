// app/api/pro/contractor/service-records/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  unit: z.string().nullable().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP is required"),
});

const createServiceRecordSchema = z
  .object({
    // Either this...
    homeId: z.string().min(1, "Home ID is required").optional(),

    // ...or this, from the verified Smarty address flow
    address: addressSchema.optional(),

    serviceType: z.string().min(1, "Service type is required"),
    serviceDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
    description: z.string().optional(),
    cost: z.number().nullable().optional(),

    warrantyIncluded: z.boolean().default(false),
    warrantyLength: z.string().optional(), // we’re using this as "expiresAt"
    warrantyDetails: z.string().optional(),
  })
  .refine(
    (val) => !!val.homeId || !!val.address,
    {
      message: "Either homeId or address is required",
      path: ["homeId"],
    }
  );

/**
 * POST /api/pro/contractor/service-records
 * Allows contractors to document completed work for a home:
 * - Connected home by homeId
 * - Any property by verified address (creates/fetches an unclaimed Home)
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

    // Resolve home: connected homeId OR find/create by verified address
    let homeId = data.homeId ?? null;

    // If we got a homeId, keep the old behavior: require an ACTIVE connection
    if (homeId) {
      const connection = await prisma.connection.findFirst({
        where: {
          contractorId: session.user.id,
          homeId,
          status: "ACTIVE",
        },
      });

      if (!connection) {
        return NextResponse.json(
          { error: "You don't have access to this property" },
          { status: 403 }
        );
      }
    }

    let home;

    if (homeId) {
      // Standard path – existing home
      home = await prisma.home.findUnique({
        where: { id: homeId },
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
    } else if (data.address) {
      // Address-only path – allow contractor to store work for any property.
      // Try to find an existing home row for this address.
      home =
        (await prisma.home.findFirst({
          where: {
            address: data.address.street,
            city: data.address.city,
            state: data.address.state,
            zip: data.address.zip,
          },
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        })) ??
        (await prisma.home.create({
          data: {
            address: data.address.street,
            city: data.address.city,
            state: data.address.state,
            zip: data.address.zip,
            // add other required Home fields here if your schema needs them
          },
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        }));

      homeId = home.id;
    } else {
      // Should be unreachable thanks to Zod refine, but keeps TS + runtime happy
      return NextResponse.json(
        { error: "Either homeId or address is required" },
        { status: 400 }
      );
    }

    // Create work record with correct status enum value
    const serviceRecord = await prisma.serviceRecord.create({
      data: {
        homeId: homeId!,
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
          address: home!.address,
          city: home!.city,
          state: home!.state,
          zip: home!.zip,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        serviceRecord: {
          id: serviceRecord.id,
          homeId: home!.id,
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

    if (error && typeof error === "object") {
      console.error(
        "Full error object:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create work record",
        details: error instanceof Error ? error.message : String(error),
      },
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