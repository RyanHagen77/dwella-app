import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import crypto from "crypto";
import { sendEmailVerificationEmail } from "@/lib/email";

// --- Password strength validation ---
function validatePasswordStrength(password: string, email?: string): string | null {
  if (!password || password.length < 10) {
    return "Password must be at least 10 characters long.";
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return "Password must include at least one letter and one number.";
  }

  const lower = password.toLowerCase();
  const bannedFragments = ["password", "123456", "qwerty", "mydwella"];

  if (bannedFragments.some((frag) => lower.includes(frag))) {
    return "Password is too easy to guess. Please choose something more unique.";
  }

  if (email) {
    const local = email.split("@")[0]?.toLowerCase();
    if (local && lower.includes(local)) {
      return "Password cannot contain your email.";
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { name, email, password, role, invitationToken } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // --- strong password check ---
    const strengthError = validatePasswordStrength(password, normalizedEmail);
    if (strengthError) {
      return NextResponse.json({ error: strengthError }, { status: 400 });
    }

    // Check if existing user
    const exists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    let userRole: Role = "HOMEOWNER";
    let invitation = null;

    // --- INVITATION FLOW ---
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

      if (invitation.invitedEmail.toLowerCase() !== normalizedEmail) {
        return NextResponse.json(
          { error: "Email must match invitation" },
          { status: 400 }
        );
      }

      // Invitations assign roles
      userRole = invitation.role;
    }

    // --- DIRECT SIGNUP RULE: ONLY HOMEOWNERS ---
    if (!invitationToken) {
      if (role && role !== "HOMEOWNER") {
        return NextResponse.json(
          { error: "Only homeowners can sign up directly" },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user (NOT verified yet)
    const user = await prisma.user.create({
      data: {
        name: name || null,
        email: normalizedEmail,
        passwordHash,
        role: userRole,
        // emailVerified: null  // default is null, leave unset
        proStatus: userRole === "PRO" ? "PENDING" : null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    // If PRO, create default profile
    if (userRole === "PRO") {
      await prisma.proProfile.create({
        data: {
          userId: user.id,
          type: "CONTRACTOR",
        },
      });
    }

    // Handle invitation → create connection
    if (invitation) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      if (invitation.homeId) {
        const isHomeownerInvite = invitation.role === "HOMEOWNER";

        await prisma.connection.create({
          data: isHomeownerInvite
            ? {
                homeownerId: user.id,
                contractorId: invitation.invitedBy,
                homeId: invitation.homeId,
                status: "ACTIVE",
                invitedBy: invitation.invitedBy,
                acceptedAt: new Date(),
              }
            : {
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

    // --- EMAIL VERIFICATION FLOW ---
    // Remove any old tokens for this user (shouldn't exist yet, but safe)
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    const verifyToken = crypto.randomBytes(32).toString("hex");

    await prisma.emailVerificationToken.create({
      data: {
        token: verifyToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    // Fire and forget the email; no need to block the response
    sendEmailVerificationEmail({
      to: normalizedEmail,
      token: verifyToken,
    }).catch((err) => {
      console.error("Error sending verification email:", err);
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}