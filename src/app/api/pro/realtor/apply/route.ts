import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      licenseNo, // Real estate license required
      phone,
      website,
      serviceAreas, // zip codes or cities
      bio,
      brokerageName, // Optional: brokerage affiliation
    } = body;

    // Validate required fields for realtors
    if (!businessName || !licenseNo || !phone) {
      return NextResponse.json(
        { error: "Business name, license number, and phone are required" },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;

    // Check if user already has a pro profile
    const existing = await prisma.proProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pro profile" },
        { status: 400 }
      );
    }

    // Create pro profile
    const proProfile = await prisma.proProfile.create({
      data: {
        userId,
        type: "REALTOR",
        businessName,
        company: brokerageName || null,
        licenseNo,
        phone,
        website: website || null,
        serviceAreas: serviceAreas || [],
        bio: bio || null,
        verified: false,
      },
    });

    // Update user status to pending-document-completed-service-submissions-records
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: "PRO",
        proStatus: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      proProfile,
      message: "Application submitted! We'll verify-document-completed-service-submissions-records your license and review shortly.",
    });
  } catch (error) {
    console.error("Error submitting realtor application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}