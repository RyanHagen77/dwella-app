// app/pro/contractor/document-completed-work-submissions-records/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ContractorWorkRecordsClient from "./ContractorWorkRecordsClient";
import Image from "next/image";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";

export default async function ContractorWorkRecordsPage() {
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
    redirect("/");
  }

  // Get all document-completed-work-submissions records for this contractor
  const workRecords = await prisma.workRecord.findMany({
    where: {
      contractorId: session.user.id,
      archivedAt: null,
    },
    include: {
      home: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedRecords = workRecords.map((record) => ({
    id: record.id,
    homeId: record.home.id,
    homeAddress: record.home.address,
    city: record.home.city,
    state: record.home.state,
    zip: record.home.zip,
    homeownerName:
      record.home.owner?.name ||
      record.home.owner?.email ||
      "Unclaimed",
    workType: record.workType,
    workDate: record.workDate.toISOString(),
    cost: record.cost ? Number(record.cost) : null,
    status: record.status,
    isVerified: record.isVerified,
    description: record.description,
    photos: record.photos as string[],
    createdAt: record.createdAt.toISOString(),
  }));

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/pro/contractor/dashboard"
            className="text-white/70 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white">Completed Work Records</span>
        </nav>

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href="/pro/contractor/dashboard"
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back to dashboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>

              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl font-bold ${heading}`}>
                  Completed Work Records
                </h1>
                <p className={`mt-1 text-sm ${textMeta}`}>
                  All jobs you’ve documented to attach work to a homeowner’s
                  MyHomeDox record.
                </p>
                <p className={`mt-1 text-xs ${textMeta}`}>
                  {formattedRecords.length} record
                  {formattedRecords.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Records list */}
        <section className={glass}>
          <ContractorWorkRecordsClient workRecords={formattedRecords} />
        </section>
      </div>
    </main>
  );
}

function Bg() {
  return (
    <div className="fixed inset-0 -z-50">
      <Image
        src="/myhomedox_home3.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
    </div>
  );
}