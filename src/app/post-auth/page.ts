import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PostAuth() {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  // Always trust DB for role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, proStatus: true },
  });

  // Admin users
  if (user?.role === "ADMIN") redirect("/admin");

  // Pro users
  if (user?.role === "PRO") {
    if (user.proStatus === "PENDING") {
      redirect("/pro/dashboard"); // Shows pending view
    }
    if (user.proStatus === "APPROVED") {
      redirect("/pro/dashboard"); // Shows full dashboard
    }
    if (user.proStatus === "REJECTED") {
      redirect("/pro/rejected"); // Optional: create rejection page
    }
    // Fallback for pros with no status
    redirect("/pro/dashboard");
  }

  // Homeowners go to /home; that page will self-redirect if they already claimed
  redirect("/home");
}