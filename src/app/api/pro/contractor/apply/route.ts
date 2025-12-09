import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      businessName,
      licenseNo,
      website,
      bio,
      specialties,
      serviceAreas,
    } = body;

    // Validate required fields
    if (!name || !email || !password || !phone || !businessName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with contractor profile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: "PRO",
        proStatus: "PENDING",
        // ✅ Auto-verify contractor email so they can log in
        emailVerified: new Date(),
        proProfile: {
          create: {
            type: "CONTRACTOR",
            businessName,
            phone, // Phone goes in proProfile, not User
            licenseNo: licenseNo || null,
            website: website || null,
            bio: bio || null,
            specialties: specialties || [],
            serviceAreas: serviceAreas || [],
          },
        },
      },
      include: {
        proProfile: true,
      },
    });

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contractor apply error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}