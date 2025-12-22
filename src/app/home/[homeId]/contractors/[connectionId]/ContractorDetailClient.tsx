// src/app/home/[homeId]/contractors/[contractorId]/ContractorDetailClient.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ctaPrimary, ctaGhost, heading, textMeta } from "@/lib/glass";

/* =========================
   Types
   ========================= */

type Contractor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  proProfile: {
    businessName: string | null;
    company: string | null;
    phone: string | null;
    rating: number | null;
    verified: boolean;
  } | null;
};

type Connection = {
  id: string;
  createdAt: string;
};

type PendingServiceAttachment = {
  id: string;
  filename: string;
  mimeType: string | null;
  size: number;
  url: string | null;
};

type PendingService = {
  id: string;
  title: string;
  description: string | null;
  serviceDate: string;
  cost: number | null;
  createdAt: string;
  attachments: PendingServiceAttachment[];
};

type ServiceRequest = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  urgency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Tab = "requests" | "submissions";

/* =========================
   Styles (match your new standard)
   ========================= */

const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";
const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

const pillWrap = "inline-flex overflow-hidden rounded-full border border-white/20 bg-white/5 p-0.5 backdrop-blur-sm";
const pillBase =
  "px-4 py-1.5 text-sm rounded-full transition flex items-center justify-center font-medium";
const pillActive =
  "bg-white/10 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.35)]";
const pillInactive = "text-white/80 hover:text-white hover:bg-white/5";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function plural(n: number, s: string) {
  return `${n} ${s}${n === 1 ? "" : "s"}`;
}

/* =========================
   Component
   ========================= */

export function ContractorDetailClient({
  homeId,
  backHref,
  contractor,
  connection,
  requestHref,
  messageHref,
  serviceRequests,
  pendingServices,
  stats,
}: {
  homeId: string;
  backHref: string;
  contractor: Contractor;
  connection: Connection;
  requestHref: string;
  messageHref: string;
  serviceRequests: ServiceRequest[];
  pendingServices: PendingService[];
  stats: {
    totalJobs: number;
    verifiedJobs: number;
    totalSpent: number; // dollars
  };
}) {
  const [activeTab, setActiveTab] = useState<Tab>("requests");

  const displayName =
    contractor.proProfile?.businessName || contractor.name || contractor.email;

  const meta = useMemo(() => {
    const connected = `Connected ${formatDate(connection.createdAt)}`;
    const req = plural(serviceRequests.length, "active request");
    const sub = plural(pendingServices.length, "pending submission");
    return `${connected} • ${req} • ${sub}`;
  }, [connection.createdAt, serviceRequests.length, pendingServices.length]);

  const desktopActions = (
    <div className="flex items-center gap-2">
      <Link href={messageHref} className={ctaGhost}>
        Message
      </Link>
      <Link href={requestHref} className={ctaPrimary}>
        + Request Service
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Standard header */}
      <PageHeader
        title={displayName}
        meta={meta}
        backHref={backHref}
        backLabel="Back"
        rightDesktop={desktopActions}
      />

      {/* Mobile actions (since PageHeader only renders rightDesktop on sm+) */}
      <div className="flex gap-2 sm:hidden">
        <Link href={messageHref} className={`${ctaGhost} flex-1`}>
          Message
        </Link>
        <Link href={requestHref} className={`${ctaPrimary} flex-1`}>
          + Request Service
        </Link>
      </div>

      {/* Details card (NOT a header) */}
      <section className={cardSurface}>
        <div className="flex items-start gap-4">
          {contractor.image ? (
            <Image
              src={contractor.image}
              alt={displayName}
              width={56}
              height={56}
              className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center text-white/80">
              <span className={`text-lg font-semibold ${heading}`}>
                {(displayName?.[0] ?? "C").toUpperCase()}
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0">
                <div className={`text-base font-semibold text-white ${heading} truncate`}>
                  {displayName}
                </div>
                <div className={`mt-1 text-sm ${textMeta} truncate`}>
                  {contractor.proProfile?.company || contractor.name || "—"}
                </div>
              </div>

              {contractor.proProfile?.verified ? (
                <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                  Verified
                </span>
              ) : null}

              {typeof contractor.proProfile?.rating === "number" ? (
                <span className="inline-flex items-center rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs font-medium text-white/80">
                  ⭐ {contractor.proProfile.rating.toFixed(1)}
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-white/75 sm:grid-cols-2">
              <div className="truncate">
                <span className="text-white/55">Phone:</span>{" "}
                {contractor.proProfile?.phone || "—"}
              </div>
              <div className="truncate">
                <span className="text-white/55">Email:</span> {contractor.email}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats grid (separate section, standard) */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Jobs" value={String(stats.totalJobs)} />
        <StatCard label="Verified Jobs" value={String(stats.verifiedJobs)} />
        <StatCard label="Total Spent" value={`$${Number(stats.totalSpent).toLocaleString()}`} tone="green" />
        <StatCard label="Pending Submissions" value={String(pendingServices.length)} />
      </section>

      {/* Tabs */}
      <div className={pillWrap}>
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={[pillBase, activeTab === "requests" ? pillActive : pillInactive].join(" ")}
        >
          Service Requests{serviceRequests.length ? ` (${serviceRequests.length})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("submissions")}
          className={[pillBase, activeTab === "submissions" ? pillActive : pillInactive].join(" ")}
        >
          Pending Submissions{pendingServices.length ? ` (${pendingServices.length})` : ""}
        </button>
      </div>

      {/* Content */}
      {activeTab === "requests" ? (
        <RequestsList homeId={homeId} serviceRequests={serviceRequests} />
      ) : (
        <PendingSubmissionsList homeId={homeId} pendingServices={pendingServices} />
      )}
    </div>
  );
}

/* =========================
   Subcomponents
   ========================= */

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green";
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/25 p-4">
      <div className="text-xs text-white/55">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone === "green" ? "text-emerald-300" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function RequestsList({
  homeId,
  serviceRequests,
}: {
  homeId: string;
  serviceRequests: ServiceRequest[];
}) {
  if (serviceRequests.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="mb-4 text-5xl">📋</div>
        <p className="text-lg text-white">No service requests.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>Requests you send to this contractor will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {serviceRequests.map((r) => (
        <Link
          key={r.id}
          href={`/home/${homeId}/service-requests/${r.id}`}
          className="block rounded-2xl border border-white/12 bg-black/25 p-5 hover:bg-black/30 transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-white">{r.title}</div>
              <div className="mt-1 text-sm text-white/70 line-clamp-2">{r.description}</div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/55">
                <span>Status: {r.status}</span>
                {r.category ? <span>• {r.category}</span> : null}
              </div>
            </div>
            <div className="shrink-0 text-xs text-white/55 text-right">
              <div>Created</div>
              <div>{formatDate(r.createdAt)}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PendingSubmissionsList({
  homeId,
  pendingServices,
}: {
  homeId: string;
  pendingServices: PendingService[];
}) {
  const router = useRouter();

  async function handleApprove(serviceId: string) {
    const res = await fetch(`/api/home/${homeId}/completed-service-submissions/${serviceId}/approve`, {
      method: "POST",
    });
    if (!res.ok) {
      alert("Failed to approve service");
      return;
    }
    router.refresh();
  }

  async function handleReject(serviceId: string) {
    if (!confirm("Are you sure you want to reject this service?")) return;
    const res = await fetch(`/api/home/${homeId}/completed-service-submissions/${serviceId}/reject`, {
      method: "POST",
    });
    if (!res.ok) {
      alert("Failed to reject service");
      return;
    }
    router.refresh();
  }

  if (pendingServices.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <p className="text-lg text-white">No services awaiting approval.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>When this contractor submits completed work, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingServices.map((s) => {
        const images = s.attachments.filter((a) => a.mimeType?.startsWith("image/"));
        const docs = s.attachments.filter((a) => a.mimeType && !a.mimeType.startsWith("image/"));

        return (
          <div key={s.id} className={cardSurface}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-white sm:text-lg">{s.title}</h3>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/60">
                  <span>Work date: {formatDate(s.serviceDate)}</span>
                  {s.cost !== null ? (
                    <span className="font-medium text-emerald-200">• Cost: ${Number(s.cost).toLocaleString()}</span>
                  ) : null}
                </div>
              </div>

              <div className="text-xs text-white/55">{formatDate(s.createdAt)}</div>
            </div>

            {s.description ? (
              <div className="mt-4">
                <div className={insetSurface}>
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{s.description}</p>
                </div>
              </div>
            ) : null}

            {s.attachments.length > 0 ? (
              <div className="mt-5 space-y-4">
                {images.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                      Photos ({images.length})
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {images.map((a) => (
                        <a
                          key={a.id}
                          href={`/api/home/${homeId}/attachments/${a.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                        >
                          <Image
                            src={`/api/home/${homeId}/attachments/${a.id}`}
                            alt={a.filename}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {docs.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                      Documents ({docs.length})
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {docs.map((a) => (
                        <a
                          key={a.id}
                          href={`/api/home/${homeId}/attachments/${a.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                            <span className="text-lg">{a.mimeType?.includes("pdf") ? "📄" : "📎"}</span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-white">{a.filename}</div>
                            <div className="text-xs text-white/60">{(a.size / 1024).toFixed(1)} KB</div>
                          </div>

                          <span className={ctaGhost}>Open</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {/* Use your standard orange primary */}
              <button type="button" onClick={() => handleApprove(s.id)} className={ctaPrimary}>
                ✓ Approve &amp; add to records
              </button>

              <button
                type="button"
                onClick={() => handleReject(s.id)}
                className="rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-400/15 hover:border-red-300/35"
              >
                ✗ Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}