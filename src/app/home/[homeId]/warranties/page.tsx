/**
 * HOME WARRANTIES PAGE
 *
 * Location: src/app/home/[homeId]/warranties/page.tsx
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import Image from "next/image";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { textMeta } from "@/lib/glass";
import AddRecordButton from "@/app/home/_components/AddRecordButton";

import { WarrantiesPageClient } from "./WarrantiesPageClient";

type PageProps = {
  params: Promise<{ homeId: string }>;
  searchParams: Promise<{ search?: string; sort?: string }>;
};

type WarrantyItem = {
  id: string;
  item: string;
  provider: string | null;
  policyNo: string | null;
  expiresAt: string | Date | null;
  note: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  formattedExpiry: string;
  attachments: Array<{
    id: string;
    filename: string;
    url: string; // ✅ always a string
    mimeType: string | null;
    size: number | null;
    uploadedBy: string;
  }>;
};

export default async function WarrantiesPage({ params, searchParams }: PageProps) {
  const { homeId } = await params;
  const { search, sort } = await searchParams;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();
  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { id: true, address: true, city: true, state: true, zip: true },
  });
  if (!home) notFound();

  const addrLine = [home.address, home.city, home.state, home.zip].filter(Boolean).join(", ");

  const where: {
    homeId: string;
    OR?: Array<{
      item?: { contains: string; mode: "insensitive" };
      provider?: { contains: string; mode: "insensitive" };
    }>;
  } = { homeId };

  if (search?.trim()) {
    where.OR = [
      { item: { contains: search.trim(), mode: "insensitive" } },
      { provider: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  type OrderBy = { expiresAt: "asc" | "desc" } | { item: "asc" };
  let orderBy: OrderBy = { expiresAt: "asc" };
  if (sort === "latest") orderBy = { expiresAt: "desc" };
  if (sort === "item") orderBy = { item: "asc" };

  const warranties = await prisma.warranty.findMany({
    where,
    orderBy,
    select: {
      id: true,
      item: true,
      provider: true,
      policyNo: true,
      expiresAt: true,
      note: true,
      createdAt: true,
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

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const warrantiesWithStatus: WarrantyItem[] = warranties.map((w) => {
    let isExpired = false;
    let isExpiringSoon = false;
    let daysUntilExpiry = 0;
    let formattedExpiry = "No expiration date";

    if (w.expiresAt) {
      const expiryDate = new Date(w.expiresAt);
      expiryDate.setHours(0, 0, 0, 0);

      daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      isExpired = expiryDate < now;
      isExpiringSoon = !isExpired && daysUntilExpiry <= 30;

      formattedExpiry = expiryDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    // ✅ Normalize attachments (uploadedBy required; url ALWAYS string)
    const attachments = (w.attachments ?? [])
      .filter((att) => att.uploadedBy !== null)
      .map((att) => ({
        id: att.id,
        filename: att.filename,
        url: att.url ?? `/api/home/${homeId}/attachments/${att.id}`, // ✅ fallback
        mimeType: att.mimeType ?? null,
        size: att.size == null ? null : typeof att.size === "bigint" ? Number(att.size) : Number(att.size),
        uploadedBy: att.uploadedBy as string,
      }));

    return {
      id: w.id,
      item: w.item,
      provider: w.provider,
      policyNo: w.policyNo,
      expiresAt: w.expiresAt,
      note: w.note,
      isExpired,
      isExpiringSoon,
      daysUntilExpiry,
      formattedExpiry,
      attachments,
    };
  });

  const expiredCount = warrantiesWithStatus.filter((w) => w.isExpired).length;
  const expiringSoonCount = warrantiesWithStatus.filter((w) => w.isExpiringSoon).length;

  // Active = has expiry + not expired
  const activeCount = warrantiesWithStatus.filter((w) => Boolean(w.expiresAt) && !w.isExpired).length;

  return (
    <main className="relative min-h-screen text-white">
      {/* Background */}
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

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Warranties" },
          ]}
        />

        <PageHeader
          backHref={`/home/${homeId}`}
          backLabel="Back to home"
          title="Warranties"
          meta={
            <span className={textMeta}>
              {warrantiesWithStatus.length} {warrantiesWithStatus.length === 1 ? "warranty" : "warranties"}
            </span>
          }
          rightDesktop={<AddRecordButton homeId={homeId} label="+ Add Warranty" defaultType="warranty" />}
        />

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard label="Active" value={activeCount} />
          <StatCard label="Expiring Soon" value={expiringSoonCount} highlight={expiringSoonCount > 0 ? "yellow" : undefined} />
          <StatCard label="Expired" value={expiredCount} highlight={expiredCount > 0 ? "red" : undefined} />
          <StatCard label="Total" value={warrantiesWithStatus.length} />
        </section>

        {/* Single body surface */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          {/* Mobile-only CTA so it never disappears */}
          <div className="mb-6 sm:hidden">
            <AddRecordButton homeId={homeId} label="+ Add Warranty" defaultType="warranty" />
          </div>

          <WarrantiesPageClient
            warranties={warrantiesWithStatus}
            homeId={homeId}
            initialSearch={search}
            initialSort={sort}
          />
        </section>

        <div className="h-12" />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: "red" | "yellow";
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{label}</div>
      <div
        className={[
          "mt-1 text-lg font-semibold leading-tight",
          highlight === "red" ? "text-red-300" : highlight === "yellow" ? "text-yellow-300" : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}