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
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { glass, glassTight, heading, textMeta } from "@/lib/glass";
import { WarrantyActions } from "./WarrantyActions";

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

  // ✅ Next.js sync-dynamic-apis fix: await params before using
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

  if (!warranty) {
    redirect(`/home/${homeId}/warranties`);
  }

  const status = computeStatus(warranty.expiresAt);
  const formattedExpiry = formatExpiry(warranty.expiresAt);

  const attachments = warranty.attachments
    .filter((a) => a.uploadedBy !== null)
    .map((a) => ({
      id: a.id,
      filename: a.filename,
      url: a.url,
      mimeType: a.mimeType,
      size: a.size == null ? 0 : Number(a.size),
      uploadedBy: a.uploadedBy as string,
    }));

  const serializedWarranty = {
    id: warranty.id,
    item: warranty.item,
    provider: warranty.provider,
    policyNo: warranty.policyNo,
    expiresAt: warranty.expiresAt,
    note: warranty.note,
    formattedExpiry,
    ...status,
    attachments,
  };

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: homeAddress, href: `/home/${homeId}` },
            { label: "Warranties", href: `/home/${homeId}/warranties` },
            { label: warranty.item },
          ]}
        />

        <section className={glass}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                href={`/home/${homeId}/warranties`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to warranties"
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
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className={`truncate text-2xl font-bold ${heading}`}>
                    {warranty.item}
                  </h1>
                  {status.isExpired && (
                    <span className="inline-flex items-center rounded border border-red-400/30 bg-red-400/20 px-2 py-1 text-xs font-medium text-red-300">
                      Expired
                    </span>
                  )}
                  {status.isExpiringSoon && !status.isExpired && (
                    <span className="inline-flex items-center rounded border border-yellow-400/30 bg-yellow-400/20 px-2 py-1 text-xs font-medium text-yellow-300">
                      Expiring Soon
                    </span>
                  )}
                </div>
                <p className={`text-sm ${textMeta}`}>
                  Expires {formattedExpiry}
                  {status.isExpired && Number.isFinite(status.daysUntilExpiry) && (
                    <span className="ml-2 text-red-400">
                      ({Math.abs(status.daysUntilExpiry)} day
                      {Math.abs(status.daysUntilExpiry) !== 1 ? "s" : ""} ago)
                    </span>
                  )}
                  {status.isExpiringSoon &&
                    !status.isExpired &&
                    Number.isFinite(status.daysUntilExpiry) && (
                      <span className="ml-2 text-yellow-400">
                        (
                        {status.daysUntilExpiry === 0
                          ? "Expires today"
                          : status.daysUntilExpiry === 1
                          ? "Expires tomorrow"
                          : `Expires in ${status.daysUntilExpiry} days`}
                        )
                      </span>
                    )}
                </p>
              </div>
            </div>

            <WarrantyActions homeId={homeId} warranty={serializedWarranty} />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <section className={glass}>
              <h2 className={`mb-4 text-lg font-medium ${heading}`}>Details</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Item" value={warranty.item} />
                <DetailField label="Provider" value={warranty.provider || "—"} />
                <DetailField label="Policy #" value={warranty.policyNo || "—"} />
                <DetailField label="Expires" value={formattedExpiry} />
              </div>

              {warranty.note && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                    Notes
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-white/80">
                    {warranty.note}
                  </p>
                </div>
              )}

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                  Attachments
                </div>

                {attachments.length === 0 ? (
                  <p className="text-sm text-white/60">No attachments.</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">
                            {att.filename}
                          </p>
                          <p className="text-xs text-white/60">
                            {att.mimeType}
                            {att.size != null
                              ? ` • ${(att.size / 1024).toFixed(1)} KB`
                              : ""}
                          </p>
                        </div>

                        <Link
                          href={`/api/home/${homeId}/attachments/${att.id}`}
                          target="_blank"
                          className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div>
            <section className={glassTight}>
              <h3 className="mb-3 text-sm font-medium text-white/70">
                Warranty Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-white/60">Status</span>
                  <span className="font-medium text-white">{status.label}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/60">Days until expiry</span>
                  <span className="font-medium text-white">
                    {Number.isFinite(status.daysUntilExpiry)
                      ? status.isExpired
                        ? `${Math.abs(status.daysUntilExpiry)} ago`
                        : status.daysUntilExpiry
                      : "—"}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-white/60">
        {label}
      </div>
      <div className="font-medium text-white">{value}</div>
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