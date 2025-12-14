export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@prisma/client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { glass, heading, textMeta, ctaPrimary } from "@/lib/glass";
import ContractorServiceRecordsClient from "./ContractorServiceRecordsClient";
import { InviteHomeownerButton } from "@/app/pro/_components/InviteHomeownerButton";

type PageProps = {
  searchParams: Promise<{ search?: string; sort?: string; filter?: string }>;
};

type SortKey = "newest" | "oldest" | "created" | "type";
type FilterKey = "all" | "pending" | "verified";

export default async function ContractorServiceRecordsPage({ searchParams }: PageProps) {
  const { search, sort, filter } = await searchParams;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    redirect("/pro/contractor/dashboard");
  }

  // Parse URL params (client uses these as initial state)
  const parsedFilter: FilterKey = filter === "pending" || filter === "verified" ? filter : "all";
  const parsedSort: SortKey = sort === "oldest" || sort === "created" || sort === "type" ? sort : "newest";
  const initialSearch = (search ?? "").trim() || undefined;

  /**
   * IMPORTANT:
   * Always fetch ALL records for correct dropdown counts.
   * Filtering/searching happens in the client.
   */
  const where: Prisma.ServiceRecordWhereInput = {
    contractorId: session.user.id,
    archivedAt: null,
  };

  // Keep a stable default order; client handles sort changes
  const orderBy: Prisma.ServiceRecordOrderByWithRelationInput = { serviceDate: "desc" };

  const serviceRecords = await prisma.serviceRecord.findMany({
    where,
    orderBy,
    include: {
      home: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const formattedRecords = serviceRecords.map((record) => ({
    id: record.id,
    homeId: record.home.id,
    homeAddress: record.home.address,
    city: record.home.city,
    state: record.home.state,
    zip: record.home.zip,
    homeownerName: record.home.owner?.name || record.home.owner?.email || "Unclaimed",
    serviceType: record.serviceType,
    serviceDate: record.serviceDate.toISOString(),
    cost: record.cost ? Number(record.cost) : null,
    status: record.status,
    isVerified: record.isVerified,
    description: record.description,
    photos: (record.photos as string[]) ?? [],
    createdAt: record.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Breadcrumb (match home pages) */}
        <div className="px-4">
          <Breadcrumb
            href="/pro/contractor/dashboard"
            label="Dashboard"
            current="Service Records"
          />
        </div>

        {/* Header (match home pages) */}
        <section className={glass}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                href="/pro/contractor/dashboard"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to dashboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </Link>

              <div className="min-w-0 flex-1">
                <h1 className={`text-2xl font-bold ${heading}`}>Service Records</h1>
                <p className={`mt-1 text-sm ${textMeta}`}>
                  {formattedRecords.length} {formattedRecords.length === 1 ? "record" : "records"} total
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <Link href="/pro/contractor/service-records/new" className={ctaPrimary}>
                + Document Service
              </Link>
              <InviteHomeownerButton />
            </div>
          </div>
        </section>

        {/* Body */}
        <ContractorServiceRecordsClient
          serviceRecords={formattedRecords}
          initialSearch={initialSearch}
          initialSort={parsedSort}
          initialFilter={parsedFilter}
        />
      </div>
    </main>
  );
}