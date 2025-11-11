import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, glassTight, textMeta, heading } from "@/lib/glass";
import HomeTopBar from "@/app/home/_components/HomeTopBar";
import { RecordsPageClient } from "@/app/home/[homeId]/records/[recordId]/_components/RecordsPageClient";
import AddRecordButton from "@/app/home/_components/AddRecordButton";

export default async function RecordsPage({
  params,
  searchParams,
}: {
  params: Promise<{ homeId: string }>;
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}) {
  const { homeId } = await params;
  const { category, search, sort } = await searchParams;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  // Get home info for header
  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  if (!home) notFound();

  const addrLine = `${home.address}${home.city ? `, ${home.city}` : ""}${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

  // Build query filters
  const where: {
    homeId: string;
    kind?: string;
    OR?: Array<{
      title?: { contains: string; mode: "insensitive" };
      vendor?: { contains: string; mode: "insensitive" };
      note?: { contains: string; mode: "insensitive" };
    }>;
  } = { homeId };

  if (category && category !== "all") {
    where.kind = category.toLowerCase();
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { vendor: { contains: search, mode: "insensitive" } },
      { note: { contains: search, mode: "insensitive" } },
    ];
  }

  // Build sort order
  type OrderBy =
    | { date: "desc" | "asc" }
    | { cost: "desc" | "asc" }
    | { title: "asc" };

  let orderBy: OrderBy = { date: "desc" }; // Default: newest first
  if (sort === "oldest") orderBy = { date: "asc" };
  if (sort === "cost-high") orderBy = { cost: "desc" };
  if (sort === "cost-low") orderBy = { cost: "asc" };
  if (sort === "title") orderBy = { title: "asc" };

  // Get all records
  const records = await prisma.record.findMany({
    where,
    orderBy,
    select: {
      id: true,
      title: true,
      note: true,
      kind: true,
      date: true,
      vendor: true,
      cost: true,
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true,
        },
      },
    },
  });

  // Get category counts for filters
  const categoryCounts = await prisma.record.groupBy({
    by: ["kind"],
    where: { homeId },
    _count: true,
  });

  const counts: Record<string, number> = {};
  categoryCounts.forEach((c) => {
    if (c.kind) counts[c.kind] = c._count;
  });

  return (
    <main className="relative min-h-screen text-white">
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

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <HomeTopBar />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link href={`/home/${homeId}`} className="text-white/70 hover:text-white transition-colors">
            {addrLine}
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white">Maintenance & Repairs</span>
        </nav>

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href={`/home/${homeId}`}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back to home"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl font-bold ${heading}`}>Maintenance & Repairs</h1>
                <p className={`text-sm ${textMeta} mt-1`}>
                  {records.length} {records.length === 1 ? "record" : "records"} total
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <AddRecordButton homeId={homeId} label="+ Add Record" defaultType="record" />
            </div>
          </div>
        </section>

        {/* Stats Overview */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Records"
            value={records.length}
          />
          <StatCard
            label="Total Spent"
            value={`$${records.reduce((sum, r) => sum + (r.cost || 0), 0).toLocaleString()}`}
          />
          <StatCard
            label="Maintenance"
            value={counts.maintenance || 0}
          />
          <StatCard
            label="Repairs"
            value={counts.repair || 0}
          />
        </section>

        {/* Client-side component for filters and list */}
        <RecordsPageClient
          records={records}
          homeId={homeId}
          initialCategory={category}
          initialSearch={search}
          initialSort={sort}
          categoryCounts={counts}
        />

        <div className="h-12" />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={glassTight}>
      <div className="text-sm text-white/70">{label}</div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}