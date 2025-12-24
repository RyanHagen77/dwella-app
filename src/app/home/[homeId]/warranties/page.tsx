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
    url: string; // always string
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
      attachments: {
        select: { id: true, filename: true, url: true, mimeType: true, size: true, uploadedBy: true },
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

    const attachments = (w.attachments ?? [])
      .filter((att) => att.uploadedBy !== null)
      .map((att) => ({
        id: att.id,
        filename: att.filename,
        url: att.url ?? `/api/home/${homeId}/attachments/${att.id}`,
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
  const activeCount = warrantiesWithStatus.filter((w) => Boolean(w.expiresAt) && !w.isExpired).length;
  const totalCount = warrantiesWithStatus.length;

  const hasAny = totalCount > 0;

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

      {/* MATCH Contractors frame */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb items={[{ label: addrLine, href: `/home/${homeId}` }, { label: "Warranties" }]} />

        <PageHeader
          backHref={`/home/${homeId}`}
          backLabel="Back to home"
          title="Warranties"
          meta={
            <span className={textMeta}>
              {totalCount} {totalCount === 1 ? "warranty" : "warranties"} •
            </span>
          }
        />

        {!hasAny ? (
          <section className="rounded-2xl border border-white/15 bg-black/55 p-8 shadow-2xl backdrop-blur-xl">
            <div className="py-6 text-center">
              <div className="mb-4 text-5xl">🧾</div>
              <h2 className="text-xl font-semibold text-white">No warranties yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
                Add warranties for appliances, systems, or policies so you can track expirations and documents in one
                place.
              </p>
            </div>
          </section>
        ) : (
          <WarrantiesPageClient
            warranties={warrantiesWithStatus}
            homeId={homeId}
            initialSearch={search}
            initialSort={sort}
            activeCount={activeCount}
            expiringSoonCount={expiringSoonCount}
            expiredCount={expiredCount}
            totalCount={totalCount}
          />
        )}

        <div className="h-12" />
      </div>
    </main>
  );
}