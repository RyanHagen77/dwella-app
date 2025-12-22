/**
 * HOME RECORDS PAGE
 *
 * Location: src/app/home/[homeId]/records/page.tsx
 */

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import AddRecordButton from "@/app/home/_components/AddRecordButton";
import { RecordsPageClient } from "./RecordsPageClient";
import { textMeta } from "@/lib/glass";

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

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  if (!home) notFound();

  const addrLine = [home.address, home.city, home.state, home.zip]
    .filter(Boolean)
    .join(", ");

  /* ---------------- Records Query ---------------- */

  const where: {
    homeId: string;
    kind?: string;
    OR?: any[];
  } = { homeId };

  if (category && category !== "all") {
    where.kind = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { vendor: { contains: search, mode: "insensitive" } },
      { note: { contains: search, mode: "insensitive" } },
    ];
  }

  let orderBy: any = { date: "desc" };
  if (sort === "oldest") orderBy = { date: "asc" };
  if (sort === "cost-high") orderBy = { cost: "desc" };
  if (sort === "cost-low") orderBy = { cost: "asc" };
  if (sort === "title") orderBy = { title: "asc" };

  const recordsRaw = await prisma.record.findMany({
    where,
    orderBy,
    select: {
      id: true,
      title: true,
      note: true,
      kind: true,
      vendor: true,
      date: true,
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

  /* ---------------- Serialization (MATCH CLIENT TYPE) ---------------- */

  const records = recordsRaw.map((r) => ({
    id: r.id,
    title: r.title,
    note: r.note,
    kind: r.kind,
    vendor: r.vendor,
    date: r.date ? r.date.toISOString() : null,
    cost: r.cost ? Number(r.cost) : null,
    attachments: r.attachments
      .filter((a) => a.uploadedBy !== null)
      .map((a) => ({
        id: a.id,
        filename: a.filename,
        url: a.url ?? null, // ✅ REQUIRED
        mimeType: a.mimeType ?? null,
        size: typeof a.size === "bigint" ? Number(a.size) : a.size,
        uploadedBy: a.uploadedBy as string,
      })),
  }));

  /* ---------------- Category Counts ---------------- */

  const grouped = await prisma.record.groupBy({
    by: ["kind"],
    where: { homeId },
    _count: true,
  });

  const categoryCounts: Record<string, number> = {};
  grouped.forEach((g) => {
    if (g.kind) categoryCounts[g.kind] = g._count;
  });

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Records" },
          ]}
        />

<PageHeader
  title="Records"
  meta={
    <span className={textMeta}>
      {records.length} {records.length === 1 ? "record" : "records"}
    </span>
  }
  backHref={`/home/${homeId}`}
  backLabel="Back to home"
  rightDesktop={
    <AddRecordButton
      homeId={homeId}
      label="+ Add Record"
      defaultType="record"
    />
  }
/>

{/* ✅ Mobile action row (shows only on mobile) */}
<div className="sm:hidden">
  <AddRecordButton
    homeId={homeId}
    label="+ Add Record"
    defaultType="record"
  />
</div>

        {/* Single body surface (NO glass-on-glass) */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <RecordsPageClient
            records={records}
            homeId={homeId}
            initialCategory={category}
            initialSearch={search}
            initialSort={sort}
            categoryCounts={categoryCounts}
          />
        </section>
      </div>
    </main>
  );
}