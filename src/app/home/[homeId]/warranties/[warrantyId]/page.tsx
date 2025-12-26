/**
 * HOMEOWNER WARRANTY DETAIL PAGE
 *
 * Location: src/app/home/[homeId]/warranties/[warrantyId]/page.tsx
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";

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

/** Match list-card sleekness */
const cardSurface =
  "rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur " +
  "shadow-[0_20px_60px_rgba(0,0,0,0.35)]";

/** Small inset slab (notes, etc.) */
const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

function statusPillClass(status: { isExpired: boolean; isExpiringSoon: boolean; label: string }, hasExpiry: boolean) {
  if (!hasExpiry) return "border-white/10 bg-white/5 text-white/60";
  if (status.isExpired) return "border-red-400/25 bg-red-400/10 text-red-100";
  if (status.isExpiringSoon) return "border-yellow-400/25 bg-yellow-400/10 text-yellow-100";
  return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
}

function leftAccentClass(status: { isExpired: boolean; isExpiringSoon: boolean }, hasExpiry: boolean) {
  if (!hasExpiry) return "before:bg-white/12";
  if (status.isExpired) return "before:bg-red-400/80";
  if (status.isExpiringSoon) return "before:bg-yellow-400/80";
  return "before:bg-emerald-400/70";
}

export default async function WarrantyDetailPage({ params }: PageProps) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  const { homeId, warrantyId } = await params;

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
    where: { id: warrantyId, homeId, deletedAt: null },
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
  const hasExpiry = Boolean(warranty.expiresAt);

  const shortExpiry = warranty.expiresAt ? formatShortDate(warranty.expiresAt) : "";
  const longExpiry = formatLongDate(warranty.expiresAt);

  const attachments = (warranty.attachments ?? [])
    .filter((a) => a.uploadedBy !== null)
    .map((a) => ({
      id: a.id,
      filename: a.filename,
      url: a.url ?? `/api/home/${homeId}/attachments/${a.id}`,
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
      {/* Background (match list pages) */}
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

      {/* Match Warranties frame */}
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

        {/* Details card (sleek + list-like) */}
        <section
          className={[
            cardSurface,
            "relative overflow-hidden",
            "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-full",
            leftAccentClass(status, hasExpiry),
          ].join(" ")}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/70">
              🧾 Warranty
            </span>

            <span
              className={[
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
                statusPillClass(status, hasExpiry),
              ].join(" ")}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailField label="Status" value={status.label} tone={status.isExpired ? "red" : status.isExpiringSoon ? "yellow" : "normal"} />
            <DetailField label="Expires" value={longExpiry} />
            <DetailField label="Provider" value={warranty.provider || "—"} />
            <DetailField label="Policy #" value={warranty.policyNo || "—"} />
          </div>

          {warranty.note ? (
            <div className="mt-6">
              <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Notes</div>
              <div className={insetSurface}>
                <p className="whitespace-pre-wrap text-sm text-white/85">{warranty.note}</p>
              </div>
            </div>
          ) : null}

          {Number.isFinite(status.daysUntilExpiry) ? (
            <div
              className={[
                "mt-6 rounded-2xl border p-3",
                status.isExpired
                  ? "border-red-400/25 bg-red-500/10"
                  : status.isExpiringSoon
                  ? "border-yellow-400/25 bg-yellow-500/10"
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
        </section>

        {/* Attachments (same sleek card language) */}
        {attachments.length > 0 ? (
          <section className={cardSurface}>
            <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Attachments ({attachments.length})</h2>

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
                        className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20 transition hover:border-white/15 hover:bg-black/25"
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
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-black/25 hover:border-white/15"
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
          </section>
        ) : null}

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
          "mt-1 text-[15px] font-semibold",
          tone === "red" ? "text-red-200" : tone === "yellow" ? "text-yellow-200" : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}