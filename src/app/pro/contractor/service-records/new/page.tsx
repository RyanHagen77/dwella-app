export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { glass, heading, textMeta } from "@/lib/glass";
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
    ownerName: conn.homeowner?.name ?? conn.homeowner?.email ?? null,
  }));

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Breadcrumb */}
        <div className="px-4">
          <Breadcrumb
            href="/pro/contractor/service-records"
            label="Service Records"
            current="Document Work"
          />
        </div>

        {/* Header (standardized) */}
        <section className={glass}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                href="/pro/contractor/service-records"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to service records"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>

              <div className="min-w-0 flex-1">
                <h1 className={`text-2xl font-bold ${heading}`}>
                  Document Work
                </h1>
                <p className={`mt-1 text-sm ${textMeta}`}>
                  Create a service record for a connected home or any verified address.
                </p>
                <p className={`mt-1 text-xs ${textMeta}`}>
                  {connectedHomes.length} connected propert
                  {connectedHomes.length === 1 ? "y" : "ies"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <DocumentServiceClient connectedHomes={connectedHomes} />
      </div>
    </main>
  );
}