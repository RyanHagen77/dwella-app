/**
 * HOME RECORD DETAIL PAGE
 *
 * Location: src/app/home/[homeId]/records/[recordId]/page.tsx
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { heading, textMeta } from "@/lib/glass";
import { RecordActions } from "./RecordActions";

type PageProps = {
  params: Promise<{ homeId: string; recordId: string }>;
};

function formatShortDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatLongDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Match warranty detail sleekness */
const cardSurface =
  "rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur " +
  "shadow-[0_20px_60px_rgba(0,0,0,0.35)]";

const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

/** Record accent bar (blue-ish like records list) */
function recordAccentClass(kind?: string | null) {
  const k = (kind ?? "").toLowerCase();
  if (k === "maintenance") return "before:bg-sky-400/70";
  if (k === "repair") return "before:bg-blue-400/70";
  if (k === "upgrade") return "before:bg-indigo-400/70";
  if (k === "project") return "before:bg-violet-400/70";
  return "before:bg-white/12";
}

export default async function RecordDetailPage({ params }: PageProps) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  const { homeId, recordId } = await params;

  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { address: true, city: true, state: true, zip: true },
  });
  if (!home) notFound();

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
          uploadedBy: true,
        },
      },

      // typed loosely; keep as you had it
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
    } as any,
  });

  if (!record || record.homeId !== homeId) notFound();

  const addrLine = [home.address, home.city, home.state, home.zip].filter(Boolean).join(", ");
  const backHref = `/home/${homeId}/records`;

  const contractor = (record as any).approvedServiceRecord?.contractor ?? null;
  const vendorLabel =
    contractor?.proProfile?.businessName ||
    contractor?.name ||
    contractor?.email ||
    record.vendor ||
    null;

  const shortDate = record.date ? formatShortDate(record.date) : "";
  const longDate = record.date ? formatLongDate(record.date) : "—";

  const showMeta = Boolean(shortDate || vendorLabel || record.cost != null);

  // Normalize attachments (BigInt -> number; keep url; drop null uploadedBy)
  const attachments = (record.attachments ?? [])
    .filter((a: any) => a.uploadedBy !== null)
    .map((a: any) => ({
      id: a.id,
      filename: a.filename,
      url: a.url ?? null,
      mimeType: a.mimeType ?? null,
      size: a.size == null ? 0 : typeof a.size === "bigint" ? Number(a.size) : Number(a.size),
      uploadedBy: a.uploadedBy as string,
    }));

  const imageAttachments = attachments.filter((a) => a.mimeType?.startsWith("image/"));
  const docAttachments = attachments.filter((a) => !a.mimeType?.startsWith("image/"));

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

  return (
    <main className="relative min-h-screen text-white">
      {/* Background (standard) */}
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
            { label: "Records", href: backHref },
            { label: record.title },
          ]}
        />

        <PageHeader
          backHref={backHref}
          backLabel="Back to records"
          title={record.title}
          meta={
            showMeta ? (
              <div className="max-w-full overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch]">
                <span className={`text-sm ${textMeta}`}>
                  {shortDate ? <>📅 {shortDate}</> : null}
                  {shortDate && vendorLabel ? " • " : null}
                  {vendorLabel ? <>🔧 {vendorLabel}</> : null}
                  {(shortDate || vendorLabel) && record.cost != null ? " • " : null}
                  {record.cost != null ? <>💵 ${Number(record.cost).toLocaleString()}</> : null}
                </span>
              </div>
            ) : null
          }
          rightDesktop={
            <RecordActions recordId={recordId} homeId={homeId} record={serializedRecord as any} />
          }
        />

        {/* ✅ Mobile actions (PageHeader right slot is desktop-only in your layout) */}
        <div className="flex justify-end sm:hidden">
          <RecordActions recordId={recordId} homeId={homeId} record={serializedRecord as any} />
        </div>

        {/* Details card (warranty-style + accent bar) */}
        <section
          className={[
            cardSurface,
            "relative overflow-hidden",
            "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-full",
            recordAccentClass(record.kind),
          ].join(" ")}
        >
          {/* Top pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/70">
              🧾 Record
            </span>

            {record.kind ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                {record.kind}
              </span>
            ) : null}
          </div>

          {/* Fields */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailField label="Date" value={longDate} />
            <DetailField label="Vendor" value={vendorLabel || "—"} />
            <DetailField label="Category" value={record.kind || "—"} />
            <DetailField label="Cost" value={record.cost != null ? `$${Number(record.cost).toLocaleString()}` : "—"} />
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
        </section>

        {/* Attachments (same language as warranties) */}
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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className={`text-xs font-semibold uppercase tracking-wide ${textMeta}`}>{label}</div>
      <div className="mt-1 text-[15px] font-semibold text-white">{value}</div>
    </div>
  );
}