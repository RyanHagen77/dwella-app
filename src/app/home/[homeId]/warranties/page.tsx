import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, glassTight, textMeta, heading } from "@/lib/glass";
import { WarrantiesPageClient } from "./_components/WarrantiesPageClient";
import AddRecordButton from "@/app/home/_components/AddRecordButton";

export default async function WarrantiesPage({
  params,
  searchParams,
}: {
  params: { homeId: string };
  searchParams: { search?: string; sort?: string };
}) {
  const { homeId } = params;
  const { search, sort } = searchParams;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { id: true, address: true, city: true, state: true, zip: true },
  });

  if (!home) notFound();

  const addrLine = `${home.address}${home.city ? `, ${home.city}` : ""}${
    home.state ? `, ${home.state}` : ""
  }${home.zip ? ` ${home.zip}` : ""}`;

  const where: {
    homeId: string;
    OR?: Array<{
      item?: { contains: string; mode: "insensitive" };
      provider?: { contains: string; mode: "insensitive" };
    }>;
  } = { homeId };

  if (search) {
    where.OR = [
      { item: { contains: search, mode: "insensitive" } },
      { provider: { contains: search, mode: "insensitive" } },
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
        },
      },
    },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const warrantiesWithStatus = warranties.map((w) => {
    let isExpired = false;
    let isExpiringSoon = false;
    let daysUntilExpiry = 0;
    let formattedExpiry = "No expiration date";

    if (w.expiresAt) {
      const expiryDate = new Date(w.expiresAt);
      expiryDate.setHours(0, 0, 0, 0);

      daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      isExpired = expiryDate < now;
      isExpiringSoon = !isExpired && daysUntilExpiry <= 30;

      formattedExpiry = expiryDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

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
      attachments: w.attachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        url: att.url,
        mimeType: att.mimeType,
        size: att.size == null ? null : Number(att.size),
      })),
    };
  });

  const expiredCount = warrantiesWithStatus.filter((w) => w.isExpired).length;
  const activeCount = warrantiesWithStatus.filter(
    (w) => !w.isExpired && w.expiresAt
  ).length;
  const expiringSoonCount = warrantiesWithStatus.filter(
    (w) => w.isExpiringSoon
  ).length;

  return (
    <main className="min-h-screen text-white">
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
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href={`/home/${homeId}`}
            className="text-white/70 hover:text-white transition-colors"
          >
            {addrLine}
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white">Warranties</span>
        </nav>

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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl font-bold ${heading}`}>Warranties</h1>
                <p className={`text-sm ${textMeta} mt-1`}>
                  {warrantiesWithStatus.length}{" "}
                  {warrantiesWithStatus.length === 1 ? "warranty" : "warranties"}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <AddRecordButton
                homeId={homeId}
                label="+ Add Warranty"
                defaultType="warranty"
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={warrantiesWithStatus.length} />
          <StatCard
            label="Expired"
            value={expiredCount}
            highlight={expiredCount > 0 ? "red" : undefined}
          />
          <StatCard label="Active" value={activeCount} />
          <StatCard
            label="Expiring Soon"
            value={expiringSoonCount}
            highlight={expiringSoonCount > 0 ? "yellow" : undefined}
          />
        </section>

        <WarrantiesPageClient
          warranties={warrantiesWithStatus}
          homeId={homeId}
          initialSearch={search}
          initialSort={sort}
        />

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
    <div className={glassTight}>
      <div className="text-sm text-white/70">{label}</div>
      <div
        className={`mt-1 text-xl font-semibold ${
          highlight === "red"
            ? "text-red-400"
            : highlight === "yellow"
            ? "text-yellow-400"
            : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}