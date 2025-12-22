/**
 * HOME RECORD DETAIL PAGE
 *
 * Location: src/app/home/[homeId]/records/[recordId]/page.tsx
 */

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { heading, textMeta } from "@/lib/glass";
import { RecordActions } from "./RecordActions";

type PageProps = {
  params: { homeId: string; recordId: string };
};

function formatShortDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatLongDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";
const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";

export default async function RecordDetailPage({ params }: PageProps) {
  const { homeId, recordId } = params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  const record = await prisma.record.findUnique({
    where: { id: recordId },
    include: {
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true,
          createdAt: true,
          uploadedBy: true,
        },
      },

      // ✅ This is the *only* safe path in your schema to a contractor/company name
      approvedServiceRecord: {
        select: {
          id: true,
          contractor: {
            select: {
              name: true,
              email: true,
              image: true,
              proProfile: { select: { businessName: true } },
            },
          },
        },
      },
    },
  });

  if (!record || record.homeId !== homeId) notFound();

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { address: true, city: true, state: true, zip: true },
  });

  if (!home) notFound();

  const addrLine = [home.address, home.city, home.state, home.zip].filter(Boolean).join(", ");
  const backHref = `/home/${homeId}/records`;

  // ✅ Normalize attachments (BigInt -> number; keep url; drop null uploadedBy)
  const attachments = (record.attachments ?? [])
    .filter((a) => a.uploadedBy !== null)
    .map((a) => ({
      id: a.id,
      filename: a.filename,
      url: a.url ?? null,
      mimeType: a.mimeType ?? null,
      size: a.size == null ? 0 : typeof a.size === "bigint" ? Number(a.size) : a.size,
      uploadedBy: a.uploadedBy as string,
    }));

  const serializedRecord = {
    id: record.id,
    title: record.title,
    date: record.date,
    kind: record.kind,
    vendor: record.vendor,
    cost: record.cost != null ? Number(record.cost) : null,
    note: record.note,
    attachments,
  };

  const imageAttachments = attachments.filter((a) => a.mimeType?.startsWith("image/"));
  const docAttachments = attachments.filter((a) => !a.mimeType?.startsWith("image/"));

  const shortDate = record.date ? formatShortDate(record.date) : "";
  const longDate = record.date ? formatLongDate(record.date) : "";

  // ✅ Company/vendor label (businessName first, then name/email, then record.vendor)
  const contractor = record.approvedServiceRecord?.contractor ?? null;
  const vendorLabel =
    contractor?.proProfile?.businessName ||
    contractor?.name ||
    contractor?.email ||
    record.vendor ||
    "";

  const showKind = Boolean(record.kind);
  const showMeta = Boolean(record.date || vendorLabel);

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Records", href: backHref },
            { label: record.title },
          ]}
        />

        {/* Header: company name + single-line meta (no wrapping) */}
        <header className="flex items-start justify-between gap-3">
          {/* Left */}
          <div className="flex min-w-0 items-start gap-3">
            <Link
              href={backHref}
              aria-label="Back to records"
              className="mt-1 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-white/80"
            >
              ←
            </Link>

            <div className="min-w-0">
              <h1 className={`truncate text-2xl font-bold ${heading}`}>{record.title}</h1>

              {showKind ? (
                <div className="mt-2">
                  <div
                    className={[
                      "max-w-full",
                      "overflow-x-auto",
                      "whitespace-nowrap",
                      "[-webkit-overflow-scrolling:touch]",
                    ].join(" ")}
                  >
                    <span className={`text-sm ${textMeta}`}>
                      {record.date ? <>📅 {shortDate}</> : null}
                      {record.date && vendorLabel ? " • " : null}
                      {vendorLabel ? <>🔧 {vendorLabel}</> : null}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex flex-shrink-0 items-start">
            <RecordActions recordId={recordId} homeId={homeId} record={serializedRecord} />
          </div>
        </header>

        {/* Single body surface */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <div className="space-y-8">
            {/* Details */}
            <div className={cardSurface}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Date</div>
                  <div className="mt-1 font-medium text-white">{longDate}</div>
                </div>

                {vendorLabel ? (
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Vendor</div>
                    <div className="mt-1 font-medium text-white">{vendorLabel}</div>
                  </div>
                ) : null}

                {record.cost != null ? (
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Cost</div>
                    <div className="mt-1 text-lg font-bold text-green-300">
                      ${Number(record.cost).toLocaleString()}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Notes */}
              {record.note ? (
                <div className="mt-6">
                  <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Notes</div>
                  <div className={insetSurface}>
                    <p className="whitespace-pre-wrap text-sm text-white/85">{record.note}</p>
                  </div>
                </div>
              ) : null}

              {/* Verified */}
              {record.verifiedBy && record.verifiedAt ? (
                <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-3">
                  <p className="text-sm text-green-200">
                    ✓ Verified on{" "}
                    {new Date(record.verifiedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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