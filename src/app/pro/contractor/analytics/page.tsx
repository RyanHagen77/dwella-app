// app/pro/contractor/analytics/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ContractorAnalyticsClient from "./ContractorAnalyticsClient";

export default async function ContractorAnalyticsPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  if (!session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // If pending, keep behavior consistent with dashboard
  if (session.user.proStatus === "PENDING") {
    redirect("/pro/contractor/pending");
  }

  const proProfile = await prisma.proProfile.findUnique({
    where: { userId },
    select: {
      businessName: true,
      type: true,
      verified: true,
      rating: true,
    },
  });

  const activeClients = await prisma.connection.count({
    where: {
      contractorId: userId,
      status: "ACTIVE",
    },
  });

  // You can safely add more counts later (e.g., invitations, records, quotes)
  // and pass them down through props.

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl p-6">
        <ContractorAnalyticsClient
          businessName={proProfile?.businessName || null}
          proType={proProfile?.type || null}
          verified={proProfile?.verified ?? false}
          rating={proProfile?.rating ?? null}
          activeClients={activeClients}
        />
      </div>
    </main>
  );
}