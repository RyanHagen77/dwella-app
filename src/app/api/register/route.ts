import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, invitationToken } = await req.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
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
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Determine user role
    let userRole: Role = "HOMEOWNER"; // Default
    let invitation = null;

    // Check invitation if token provided
    if (invitationToken) {
      invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
      });

      if (!invitation) {
        return NextResponse.json(
          { error: "Invalid invitation" },
          { status: 400 }
        );
      }

      if (invitation.status !== "PENDING") {
        return NextResponse.json(
          { error: "Invitation already used" },
          { status: 400 }
        );
      }

      if (invitation.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Invitation expired" },
          { status: 400 }
        );
      }

      if (invitation.invitedEmail.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email must match invitation" },
          { status: 400 }
        );
      }

      // Use role from invitation
      userRole = invitation.role;
    } else if (role) {
      // Validate role if provided directly (not from invitation)
      if (role === "PRO" || role === "HOMEOWNER" || role === "ADMIN") {
        userRole = role as Role;
      } else {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        role: userRole,
        emailVerified: invitationToken ? new Date() : null, // Auto-verify if invited
        proStatus: userRole === "PRO" ? "PENDING" : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // If PRO role, create ProProfile
    if (userRole === "PRO") {
      await prisma.proProfile.create({
        data: {
          userId: user.id,
          type: "CONTRACTOR", // Default, they can update later
        },
      });
    }

    // If invitation exists, handle connection creation
    if (invitation) {
      // Mark invitation as accepted
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      // Create connection if homeId was provided
      if (invitation.homeId) {
        if (invitation.role === "HOMEOWNER") {
          // PRO invited HOMEOWNER
          await prisma.connection.create({
            data: {
              homeownerId: user.id,
              contractorId: invitation.invitedBy,
              homeId: invitation.homeId,
              status: "ACTIVE",
              invitedBy: invitation.invitedBy,
              acceptedAt: new Date(),
            },
          });
        } else if (invitation.role === "PRO") {
          // HOMEOWNER invited PRO
          await prisma.connection.create({
            data: {
              homeownerId: invitation.invitedBy,
              contractorId: user.id,
              homeId: invitation.homeId,
              status: "ACTIVE",
              invitedBy: invitation.invitedBy,
              acceptedAt: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}