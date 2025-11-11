import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ProType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      password,
      phone,
      businessName,
      type,
      licenseNo,
      website,
      bio,
    } = await req.json();

    // Validate required fields
    if (!name || !email || !password || !phone || !businessName || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with PRO role and PENDING status
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "PRO",
        proStatus: "PENDING",
      },
    });

    // Create ProProfile
    await prisma.proProfile.create({
      data: {
        userId: user.id,
        type: type as ProType,
        businessName,
        company: businessName,
        phone,
        licenseNo: licenseNo || null,
        website: website || null,
        bio: bio || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Pro application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}