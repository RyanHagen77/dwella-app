// app/pro/contractor/document-completed-service-submissions-records/new/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DocumentServiceClient } from "./DocumentServiceClient";

export default async function DocumentServicePage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verify user is a contractor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    redirect("/dashboard");
  }

  // Get all ACTIVE document-completed-service-submissions for this contractor
  const connections = await prisma.connection.findMany({
    where: {
      contractorId: session.user.id,
      status: "ACTIVE",
    },
    include: {
      home: true,
      homeowner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      acceptedAt: "desc",
    },
  });

  const connectedHomes = connections.map((conn) => ({
    id: conn.home.id,
    address: conn.home.address,
    city: conn.home.city,
    state: conn.home.state,
    zip: conn.home.zip,
    ownerName: conn.homeowner.name,
  }));

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-4xl p-6">
        <DocumentServiceClient connectedHomes={connectedHomes} />
      </div>
    </main>
  );
}
