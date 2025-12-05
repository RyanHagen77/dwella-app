import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, glassTight, textMeta, heading } from "@/lib/glass";
import { RecordsPageClient } from "@/app/home/[homeId]/records/RecordsPageClient";
import AddRecordButton from "@/app/home/_components/AddRecordButton";
import Breadcrumb from "@/components/ui/Breadcrumb";

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

  // Get stats info for header
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

  const addrLine = `${home.address}${
    home.city ? `, ${home.city}` : ""
  }${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

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
  const recordsRaw = await prisma.record.findMany({
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
          uploadedBy: true,
        },
      },
    },
  });

  // Serialize Decimal, Date, and bigint
  const records = recordsRaw.map((record) => ({
    ...record,
    date: record.date ? record.date.toISOString() : null,
    cost: record.cost ? Number(record.cost) : null,
    attachments: record.attachments
      .filter((att) => att.uploadedBy !== null)
      .map((att) => ({
        ...att,
        size: Number(att.size),
        uploadedBy: att.uploadedBy as string,
      })),
  }));

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
      <Bg />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4">
          <Breadcrumb
            href={`/home/${homeId}`}
            label={addrLine}
            current="Records"
          />
        </div>

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                href={`/home/${homeId}`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to home"
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
                  Records
                </h1>
                <p className={`mt-1 text-sm ${textMeta}`}>
                  {records.length}{" "}
                  {records.length === 1 ? "record" : "records"} total
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <AddRecordButton
                homeId={homeId}
                label="+ Add Record"
                defaultType="record"
              />
            </div>
          </div>
        </section>

        {/* Stats Overview */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Records" value={records.length} />
          <StatCard
            label="Total Spent"
            value={`$${records
              .reduce((sum, r) => sum + (r.cost || 0), 0)
              .toLocaleString()}`}
          />
          <StatCard label="Maintenance" value={counts.maintenance || 0} />
          <StatCard label="Repairs" value={counts.repair || 0} />
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