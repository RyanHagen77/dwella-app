/**
 * ADMIN AUTHENTICATION UTILITIES
 *
 * Provides route protection for admin pages.
 * Verifies user role and redirects unauthorized users.
 *
 * Location: lib/adminAuth.ts
 */

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type AdminSession = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "ADMIN";
  };
};

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "ADMIN",
    },
  };
}

export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}