/**
 * HOMEOWNER WARRANTY DETAIL PAGE
 *
 * Shows a single warranty for a specific home.
 *
 * Location: src/app/home/[homeId]/warranties/[warrantyId]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { heading, textMeta } from "@/lib/glass";

import { WarrantyActions } from "./WarrantyActions";

type PageProps = {
  params: Promise<{ homeId: string; warrantyId: string }>;
};

function formatShortDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatLongDate(value: Date | string | null | undefined) {
  if (!value) return "No expiration date";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "No expiration date";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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

  // date-only comparison
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const exp = new Date(expiresAt);
  exp.setHours(0, 0, 0, 0);

  const diffMs = exp.getTime() - now.getTime();
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

const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";
const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";

export default async function WarrantyDetailPage({ params }: PageProps) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  const { homeId, warrantyId } = await params;

  // Your authz helper
  const { requireHomeAccess } = await import("@/lib/authz");
  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { address: true, city: true, state: true, zip: true },
  });

  if (!home) notFound();

  const addrLine = [home.address, home.city, home.state, home.zip].filter(Boolean).join(", ");
  const backHref = `/home/${homeId}/warranties`;

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
          createdAt: true,
        },
      },
    },
  });

  if (!warranty) redirect(backHref);

  const status = computeStatus(warranty.expiresAt);
  const shortExpiry = warranty.expiresAt ? formatShortDate(warranty.expiresAt) : "";
  const longExpiry = formatLongDate(warranty.expiresAt);

  // ✅ Normalize attachments (uploadedBy required; url ALWAYS string; BigInt -> number)
  const attachments = (warranty.attachments ?? [])
    .filter((a) => a.uploadedBy !== null)
    .map((a) => ({
      id: a.id,
      filename: a.filename,
      url: a.url ?? `/api/home/${homeId}/attachments/${a.id}`, // ✅ fallback
      mimeType: a.mimeType ?? null,
      size: a.size == null ? null : typeof a.size === "bigint" ? Number(a.size) : Number(a.size),
      uploadedBy: a.uploadedBy as string,
    }));

  const imageAttachments = attachments.filter((a) => a.mimeType?.startsWith("image/"));
  const docAttachments = attachments.filter((a) => !a.mimeType?.startsWith("image/"));

  const serializedWarranty = {
    id: warranty.id,
    item: warranty.item,
    provider: warranty.provider,
    policyNo: warranty.policyNo,
    expiresAt: warranty.expiresAt,
    note: warranty.note,
    formattedExpiry: longExpiry,
    ...status,
    attachments,
  };

  const showMeta = Boolean(warranty.provider || warranty.policyNo || shortExpiry);

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Warranties", href: backHref },
            { label: warranty.item },
          ]}
        />

        <PageHeader
          backHref={backHref}
          backLabel="Back to warranties"
          title={warranty.item}
          meta={
            showMeta ? (
              <div className="max-w-full overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch]">
                <span className={`text-sm ${textMeta}`}>
                  {shortExpiry ? <>📅 {shortExpiry}</> : null}
                  {shortExpiry && (warranty.provider || warranty.policyNo) ? " • " : null}
                  {warranty.provider ? <>🛡️ {warranty.provider}</> : null}
                  {warranty.provider && warranty.policyNo ? " • " : null}
                  {warranty.policyNo ? <># {warranty.policyNo}</> : null}
                </span>
              </div>
            ) : null
          }
          rightDesktop={<WarrantyActions homeId={homeId} warranty={serializedWarranty} />}
        />

        {/* Single body surface */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <div className="space-y-8">
            {/* Details */}
            <div className={cardSurface}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <DetailField label="Status" value={status.label} tone={status.isExpired ? "red" : status.isExpiringSoon ? "yellow" : "normal"} />
                <DetailField label="Expires" value={longExpiry} />
                <DetailField label="Provider" value={warranty.provider || "—"} />
                <DetailField label="Policy #" value={warranty.policyNo || "—"} />
              </div>

              {/* Notes */}
              {warranty.note ? (
                <div className="mt-6">
                  <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Notes</div>
                  <div className={insetSurface}>
                    <p className="whitespace-pre-wrap text-sm text-white/85">{warranty.note}</p>
                  </div>
                </div>
              ) : null}

              {/* Status callout */}
              {Number.isFinite(status.daysUntilExpiry) ? (
                <div
                  className={[
                    "mt-6 rounded-2xl border p-3",
                    status.isExpired
                      ? "border-red-500/30 bg-red-500/10"
                      : status.isExpiringSoon
                      ? "border-yellow-500/30 bg-yellow-500/10"
                      : "border-white/12 bg-white/5",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "text-sm",
                      status.isExpired ? "text-red-200" : status.isExpiringSoon ? "text-yellow-200" : "text-white/80",
                    ].join(" ")}
                  >
                    {status.isExpired
                      ? `Expired ${Math.abs(status.daysUntilExpiry)} day${Math.abs(status.daysUntilExpiry) === 1 ? "" : "s"} ago.`
                      : status.daysUntilExpiry === 0
                      ? "Expires today."
                      : status.daysUntilExpiry === 1
                      ? "Expires tomorrow."
                      : `Expires in ${status.daysUntilExpiry} days.`}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Attachments */}
            {attachments.length > 0 ? (
              <div className={cardSurface}>
                <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Attachments ({attachments.length})</h2>

                {/* Photos */}
                {imageAttachments.length > 0 ? (
                  <div className="mb-8">
                    <div className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>
                      Photos ({imageAttachments.length})
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {imageAttachments.map((a) => {
                        const href = `/api/home/${homeId}/attachments/${a.id}`;
                        return (
                          <a
                            key={a.id}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                          >
                            <Image
                              src={href}
                              alt={a.filename}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-cover"
                            />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Documents */}
                {docAttachments.length > 0 ? (
                  <div>
                    <div className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>
                      Documents ({docAttachments.length})
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {docAttachments.map((a) => {
                        const href = `/api/home/${homeId}/attachments/${a.id}`;
                        const sizeKb = a.size ? (Number(a.size) / 1024).toFixed(1) : null;

                        return (
                          <a
                            key={a.id}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors hover:bg-black/25"
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                              <span className="text-lg">{a.mimeType?.includes("pdf") ? "📄" : "📎"}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-white">{a.filename}</div>
                              <div className="text-xs text-white/60">
                                {a.mimeType ?? "Document"}
                                {sizeKb ? ` • ${sizeKb} KB` : ""}
                              </div>
                            </div>

                            <span className="text-xs text-white/60">Open</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <div className="h-12" />
      </div>
    </main>
  );
}

function DetailField({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: "normal" | "red" | "yellow";
}) {
  return (
    <div>
      <div className={`text-xs font-semibold uppercase tracking-wide ${textMeta}`}>{label}</div>
      <div
        className={[
          "mt-1 font-medium",
          tone === "red" ? "text-red-200" : tone === "yellow" ? "text-yellow-200" : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}