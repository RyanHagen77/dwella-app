/**
 * HOMEOWNER WARRANTY DETAIL PAGE
 *
 * Shows a single warranty for a specific home.
 *
 * Location: app/home/[homeId]/warranties/[warrantyId]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireHomeAccess } from "@/lib/authz";
import Image from "next/image";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { glass, heading, textMeta } from "@/lib/glass";
import WarrantyDetailClient from "./WarrantyDetailClient";

function formatExpiry(expiresAt: Date | null) {
  if (!expiresAt) return "No expiration date";
  return expiresAt.toLocaleDateString();
}

function computeStatus(expiresAt: Date | null) {
  if (!expiresAt) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      daysUntilExpiry: Infinity,
      label: "No expiry",
    };
  }

  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isExpired = days < 0;
  const isExpiringSoon = !isExpired && days <= 30;

  return {
    isExpired,
    isExpiringSoon,
    daysUntilExpiry: days,
    label: isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : "Active",
  };
}

export default async function WarrantyDetailPage({
  params,
}: {
  params: Promise<{ homeId: string; warrantyId: string }>;
}) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { homeId, warrantyId } = await params;

  await requireHomeAccess(homeId, userId);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { address: true, city: true, state: true, zip: true },
  });

  if (!home) redirect("/");

  const homeAddress = `${home.address}${home.city ? `, ${home.city}` : ""}${
    home.state ? `, ${home.state}` : ""
  }${home.zip ? ` ${home.zip}` : ""}`;

  const warranty = await prisma.warranty.findFirst({
    where: {
      id: warrantyId,
      homeId,
      deletedAt: null,
    },
    include: {
      attachments: true,
    },
  });

  if (!warranty) {
    redirect(`/home/${homeId}/warranties`);
  }

  const status = computeStatus(warranty.expiresAt);
  const formattedExpiry = formatExpiry(warranty.expiresAt);

  const detail = {
    id: warranty.id,
    item: warranty.item,
    provider: warranty.provider,
    policyNo: warranty.policyNo,
    expiresAt: warranty.expiresAt,
    note: warranty.note,
    formattedExpiry,
    ...status,
    attachments: warranty.attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      url: a.url,
      mimeType: a.mimeType,
      // Prisma returns bigint for BigInt columns. Convert safely.
      size: a.size == null ? null : Number(a.size),
    })),
  };

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <Breadcrumb
          href={`/home/${homeId}`}
          label={homeAddress}
          current="Warranties"
        />

        {/* Header card like reminders */}
        <section className={glass}>
          <div className="flex items-center gap-3">
            <a
              href={`/home/${homeId}/warranties`}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Back to warranties"
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
            </a>

            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl font-bold ${heading}`}>
                {warranty.item}
              </h1>
              <p className={`mt-1 text-sm ${textMeta}`}>
                Warranty details
              </p>
            </div>
          </div>
        </section>

        {/* Detail body */}
        <WarrantyDetailClient
          homeId={homeId}
          warranty={detail}
        />
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