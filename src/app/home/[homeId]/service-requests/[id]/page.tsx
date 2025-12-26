/**
 * JOB REQUEST DETAIL PAGE (HOMEOWNER)
 *
 * Location: app/stats/[homeId]/service-requests/[serviceId]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { requireHomeAccess } from "@/lib/authz";
import { getSignedGetUrl, extractS3Key } from "@/lib/s3";

import Image from "next/image";
import Link from "next/link";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { heading, textMeta } from "@/lib/glass";

import { ServiceRequestsActions } from "../_components/ServiceRequestsActions";
import type { ServiceRequestForActions } from "../_types";

type PageProps = {
  params: Promise<{ homeId: string; id: string }>;
};

function formatShortDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatLongDateTime(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " • " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Match warranty/list-card sleekness */
const cardSurface =
  "rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur " +
  "shadow-[0_20px_60px_rgba(0,0,0,0.35)]";

/** Small inset slab (notes, etc.) */
const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

function statusPillClass(status: string) {
  const map: Record<string, string> = {
    PENDING: "border-orange-500/20 bg-orange-500/15 text-orange-200",
    QUOTED: "border-blue-500/20 bg-blue-500/15 text-blue-200",
    ACCEPTED: "border-emerald-500/20 bg-emerald-500/15 text-emerald-200",
    IN_PROGRESS: "border-purple-500/20 bg-purple-500/15 text-purple-200",
    COMPLETED: "border-emerald-500/20 bg-emerald-500/15 text-emerald-200",
    DECLINED: "border-red-400/25 bg-red-500/10 text-red-100",
    CANCELLED: "border-white/10 bg-white/5 text-white/60",
  };
  return map[status] ?? map.PENDING;
}

function leftAccentClass(status: string) {
  if (status === "DECLINED") return "before:bg-red-400/80";
  if (status === "CANCELLED") return "before:bg-white/12";
  if (status === "COMPLETED") return "before:bg-emerald-400/70";
  if (status === "IN_PROGRESS") return "before:bg-purple-400/70";
  if (status === "ACCEPTED") return "before:bg-emerald-400/60";
  if (status === "QUOTED") return "before:bg-blue-400/70";
  return "before:bg-orange-400/70";
}

function labelStatus(status: string) {
  return status.replaceAll("_", " ");
}

function truncFilename(name: string) {
  if (name.length <= 36) return name;
  return name.slice(0, 22) + "…" + name.slice(-10);
}

export default async function ServiceRequestDetailPage({ params }: PageProps) {
  const { homeId, id } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  await requireHomeAccess(homeId, session.user.id);

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      home: { select: { address: true, city: true, state: true, zip: true } },
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: {
            select: {
              businessName: true,
              company: true,
              phone: true,
              verified: true,
              rating: true,
              completedJobs: true,
            },
          },
        },
      },
      quote: { include: { items: true } },
      serviceRecord: {
        select: { id: true, serviceType: true, serviceDate: true, status: true, cost: true },
      },
    },
  });

  if (!serviceRequest) notFound();

  if (serviceRequest.homeId !== homeId || serviceRequest.homeownerId !== session.user.id) {
    redirect(`/home/${homeId}`);
  }

  const backHref = `/home/${homeId}/completed-service-submissions`;
  const addrLine = [serviceRequest.home.address, serviceRequest.home.city, serviceRequest.home.state, serviceRequest.home.zip]
    .filter(Boolean)
    .join(", ");

  // Sign photo URLs from S3
  const signedPhotos = await Promise.all(
    (serviceRequest.photos || []).map(async (url) => {
      const key = extractS3Key(url);
      return await getSignedGetUrl(key);
    })
  );

  const serviceRequestForActions: ServiceRequestForActions = {
    id: serviceRequest.id,
    status: serviceRequest.status,
    quoteId: serviceRequest.quoteId,
  };

  const contractorLabel =
    serviceRequest.contractor?.proProfile?.businessName ||
    serviceRequest.contractor?.name ||
    serviceRequest.contractor?.email ||
    "Contractor";

  const showMeta = Boolean(serviceRequest.category || serviceRequest.desiredDate || serviceRequest.urgency);

  return (
    <main className="relative min-h-screen text-white">

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Requests & Submissions", href: backHref },
            { label: serviceRequest.title },
          ]}
        />

        <PageHeader
          backHref={backHref}
          backLabel="Back to requests"
          title={serviceRequest.title}
          meta={
            <div className="max-w-full overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch]">
              <span className={`text-sm ${textMeta}`}>
                <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs mr-2", statusPillClass(serviceRequest.status)].join(" ")}>
                  {labelStatus(serviceRequest.status)}
                </span>
                {showMeta ? (
                  <>
                    {serviceRequest.desiredDate ? <>📅 {formatShortDate(serviceRequest.desiredDate)}</> : null}
                    {serviceRequest.desiredDate && (serviceRequest.category || serviceRequest.urgency) ? " • " : null}
                    {serviceRequest.category ? <>🏷️ {serviceRequest.category}</> : null}
                    {serviceRequest.category && serviceRequest.urgency ? " • " : null}
                    {serviceRequest.urgency ? <>⚡ {serviceRequest.urgency}</> : null}
                  </>
                ) : null}
              </span>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT */}
          <div className="space-y-6 lg:col-span-2">
            {/* Main details card (warranty-style: accent bar + pills + fields grid + notes inset) */}
            <section
              className={[
                cardSurface,
                "relative overflow-hidden",
                "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-full",
                leftAccentClass(serviceRequest.status),
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/70">
                  📋 Service request
                </span>

                <span
                  className={[
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
                    statusPillClass(serviceRequest.status),
                  ].join(" ")}
                >
                  {labelStatus(serviceRequest.status)}
                </span>

                {serviceRequest.urgency ? (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                    ⚡ {serviceRequest.urgency}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailField label="Status" value={labelStatus(serviceRequest.status)} />
                <DetailField label="Requested" value={formatLongDateTime(serviceRequest.createdAt)} />
                <DetailField label="Preferred" value={serviceRequest.desiredDate ? formatShortDate(serviceRequest.desiredDate) : "—"} />
                <DetailField label="Category" value={serviceRequest.category || "—"} />
              </div>

              {(serviceRequest.budgetMin || serviceRequest.budgetMax) ? (
                <div className="mt-6">
                  <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Budget</div>
                  <div className={insetSurface}>
                    <p className="text-sm text-white/85">
                      ${Number(serviceRequest.budgetMin || 0).toLocaleString()} – ${Number(serviceRequest.budgetMax || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-6">
                <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Description</div>
                <div className={insetSurface}>
                  <p className="whitespace-pre-wrap text-sm text-white/85">{serviceRequest.description}</p>
                </div>
              </div>

              {serviceRequest.contractorNotes ? (
                <div className="mt-6">
                  <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Contractor notes</div>
                  <div className={insetSurface}>
                    <p className="whitespace-pre-wrap text-sm text-white/85">{serviceRequest.contractorNotes}</p>
                  </div>
                </div>
              ) : null}
            </section>

            {/* Photos (warranty attachment grid style) */}
            {signedPhotos.length > 0 ? (
              <section className={cardSurface}>
                <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Photos ({signedPhotos.length})</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {signedPhotos.map((href, idx) => (
                    <a
                      key={idx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20 transition hover:border-white/15 hover:bg-black/25"
                    >
                      <Image
                        src={href}
                        alt={`Request photo ${idx + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Quote (warranty slab language) */}
            {serviceRequest.quote ? (
              <section className={cardSurface}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className={`text-lg font-semibold ${heading}`}>Quote</h2>
                  <div className="text-right">
                    <div className="text-xs text-white/55">Total</div>
                    <div className="text-2xl font-semibold text-white">
                      ${Number(serviceRequest.quote.totalAmount).toLocaleString()}
                    </div>
                  </div>
                </div>

                {serviceRequest.quote.description ? (
                  <div className="mt-4">
                    <div className={insetSurface}>
                      <p className="whitespace-pre-wrap text-sm text-white/85">{serviceRequest.quote.description}</p>
                    </div>
                  </div>
                ) : null}

                {serviceRequest.quote.items?.length ? (
                  <div className="mt-5">
                    <div className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Line items</div>
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      {serviceRequest.quote.items.map((item, i) => (
                        <div
                          key={item.id}
                          className={["flex items-start justify-between gap-4 px-4 py-3", i ? "border-t border-white/5" : ""].join(" ")}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm text-white">{item.item}</div>
                            <div className={`mt-0.5 text-xs ${textMeta}`}>
                              {Number(item.qty)} × ${Number(item.unitPrice).toLocaleString()}
                            </div>
                          </div>
                          <div className="shrink-0 text-sm font-semibold text-white">
                            ${Number(item.total).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {serviceRequest.quote.expiresAt ? (
                  <p className={`mt-4 text-xs ${textMeta}`}>Quote expires: {formatShortDate(serviceRequest.quote.expiresAt)}</p>
                ) : null}
              </section>
            ) : null}

            {/* Work completed (same link card style as warranty docs) */}
            {serviceRequest.serviceRecord ? (
              <section className={cardSurface}>
                <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Work Completed</h2>

                <Link
                  href={`/home/${homeId}/work/${serviceRequest.serviceRecord.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-black/25 hover:border-white/15"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{serviceRequest.serviceRecord.serviceType}</div>
                    <div className={`mt-1 text-xs ${textMeta}`}>
                      {serviceRequest.serviceRecord.serviceDate ? `Completed: ${formatShortDate(serviceRequest.serviceRecord.serviceDate)}` : null}
                      {serviceRequest.serviceRecord.status ? ` • ${serviceRequest.serviceRecord.status}` : null}
                    </div>
                  </div>

                  {serviceRequest.serviceRecord.cost ? (
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-white/55">Cost</div>
                      <div className="text-lg font-semibold text-white">
                        ${Number(serviceRequest.serviceRecord.cost).toLocaleString()}
                      </div>
                    </div>
                  ) : null}
                </Link>
              </section>
            ) : null}
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Actions card (client) */}
            <ServiceRequestsActions serviceRequest={serviceRequestForActions} homeId={homeId} />

            {/* Contractor (warranty-style card + inset lines) */}
            {serviceRequest.contractor ? (
              <section className={cardSurface}>
                <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Contractor</h2>

                <div className="flex items-start gap-4">
                  {serviceRequest.contractor.image ? (
                    <Image
                      src={serviceRequest.contractor.image}
                      alt={contractorLabel}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white/80">
                      <span className="text-lg font-semibold">{(contractorLabel[0] || "C").toUpperCase()}</span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate font-semibold text-white">{contractorLabel}</div>

                      {serviceRequest.contractor.proProfile?.verified ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                          Verified
                        </span>
                      ) : null}

                      {typeof serviceRequest.contractor.proProfile?.rating === "number" ? (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                          ⭐ {serviceRequest.contractor.proProfile.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>

                    {serviceRequest.contractor.proProfile?.completedJobs ? (
                      <div className={`mt-1 text-sm ${textMeta}`}>
                        {serviceRequest.contractor.proProfile.completedJobs} jobs completed
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-2">
                      {serviceRequest.contractor.proProfile?.phone ? (
                        <div className={insetSurface}>
                          <a href={`tel:${serviceRequest.contractor.proProfile.phone}`} className="text-sm text-white/85 hover:text-white">
                            📞 {serviceRequest.contractor.proProfile.phone}
                          </a>
                        </div>
                      ) : null}

                      <div className={insetSurface}>
                        <a href={`mailto:${serviceRequest.contractor.email}`} className="text-sm text-white/70 hover:text-white/90">
                          ✉️ {serviceRequest.contractor.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>

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

