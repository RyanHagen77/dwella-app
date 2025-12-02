import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmailVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Valid email is required." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, emailVerified: true },
  });

  // Don't leak whether a user exists or is verified
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // If already verified, we just no-op
  if (user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  // Remove old tokens for this user
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    },
  });

  await sendEmailVerificationEmail({ to: normalizedEmail, token });

  return NextResponse.json({ ok: true });
}