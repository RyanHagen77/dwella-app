import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProDashboardRouter() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  const userId = session.user.id as string;

  const proProfile = await prisma.proProfile.findUnique({
    where: { userId },
    select: { type: true },
  });

  // Route based on pro type
  switch (proProfile?.type) {
    case "CONTRACTOR":
      redirect("/pro/contractor/dashboard");
    case "REALTOR":
      redirect("/pro/realtor/dashboard");
    case "INSPECTOR":
      redirect("/pro/inspector/dashboard");
    default:
      redirect("/pro/contractor/dashboard"); // Fallback
  }
}