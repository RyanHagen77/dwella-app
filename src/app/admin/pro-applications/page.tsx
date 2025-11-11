import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProApplicationsList from "./ProApplicationsList";

export default async function ProApplicationsPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const applications = await prisma.user.findMany({
    where: {
      role: "PRO",
      proStatus: "PENDING",
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true, // ← ADD THIS LINE
      proProfile: {
        select: {
          businessName: true,
          type: true,
          phone: true,      // ← ADD THIS
          licenseNo: true,  // ← ADD THIS
          website: true,    // ← ADD THIS
          bio: true,        // ← ADD THIS
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Serialize dates for client component
  const serialized = applications.map(app => ({
    ...app,
    createdAt: app.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Professional Applications ({serialized.length})
      </h1>
      <ProApplicationsList applications={serialized} />
    </main>
  );
}