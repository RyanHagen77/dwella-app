// app/home/[homeId]/contractors/[connectionId]/_components/ContractorDetailTabs.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { textMeta, ctaGhost } from "@/lib/glass";

type ServiceRequest = {
  id: string;
  title: string;
  description: string;
  status: string;
  urgency: string;
  category: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  desiredDate: string | null;
  createdAt: string;
  quote: { id: string; totalAmount: number; status: string } | null;
  serviceRecord: { id: string; status: string; serviceDate: string } | null;
};

type PendingSubmission = {
  id: string;
  title?: string | null; // optional (if you have it)
  serviceType: string;
  description: string | null;
  serviceDate: string;
  createdAt: string;
  attachmentCount: number;
  hasImages: boolean;
  cost?: number | null; // optional (if you have it)
  /** Optional: lets you hide approve/reject if a row isn’t a serviceSubmission id */
  kind?: "SUBMISSION" | "RECORD";
};

type Tab = "requests" | "pending";

/* Match Completed Service page surfaces */
const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";
const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export function ContractorDetailTabs({
  homeId,
  connectionId,
  serviceRecords, // ignored now (work history removed)
  serviceRequests,
  pendingSubmissions,
  activeRequestsCount,
  pendingApprovalsCount,
  activeTab,
}: {
  homeId: string;
  connectionId: string;
  serviceRecords: any[]; // kept for prop-compat (work history removed)
  serviceRequests: ServiceRequest[];
  pendingSubmissions: PendingSubmission[];
  activeRequestsCount: number;
  pendingApprovalsCount?: number;
  activeTab: "work-history" | "requests" | "pending"; // kept for prop-compat
}) {
  const router = useRouter();

  const safeRequests = serviceRequests ?? [];
  const safePending = pendingSubmissions ?? [];

  const totalRequests = activeRequestsCount ?? safeRequests.length;
  const totalPending = pendingApprovalsCount ?? safePending.length;

  // ✅ Use the same “slider” control style as the Completed Service page
  const initial: Tab = activeTab === "pending" ? "pending" : "requests";
  const [tab, setTab] = useState<Tab>(initial);

  async function approvePending(id: string) {
    const res = await fetch(`/api/home/${homeId}/completed-service-submissions/${id}/approve`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to approve");
    router.refresh();
  }

  async function rejectPending(id: string) {
    const ok = confirm("Are you sure you want to reject this submission?");
    if (!ok) return;

    const res = await fetch(`/api/home/${homeId}/completed-service-submissions/${id}/reject`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to reject");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Tabs (Completed Service slider style) */}
      <div className="inline-flex overflow-hidden rounded-full border border-white/20 bg-white/5 p-0.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setTab("requests")}
          className={[
            "px-4 py-1.5 text-sm rounded-full transition flex items-center justify-center font-medium",
            tab === "requests"
              ? "bg-white/10 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.35)]"
              : "text-white/80 hover:text-white hover:bg-white/5",
          ].join(" ")}
        >
          Service Requests{totalRequests > 0 ? ` (${totalRequests})` : ""}
        </button>

        <button
          type="button"
          onClick={() => setTab("pending")}
          className={[
            "px-4 py-1.5 text-sm rounded-full transition flex items-center justify-center font-medium",
            tab === "pending"
              ? "bg-white/10 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.35)]"
              : "text-white/80 hover:text-white hover:bg-white/5",
          ].join(" ")}
        >
          Pending Submissions{totalPending > 0 ? ` (${totalPending})` : ""}
        </button>
      </div>

      {/* Content */}
      {tab === "requests" ? (
        <ServiceRequestsTab homeId={homeId} serviceRequests={safeRequests} />
      ) : (
        <PendingApprovalsTab
          homeId={homeId}
          connectionId={connectionId}
          pendingSubmissions={safePending}
          onApprove={approvePending}
          onReject={rejectPending}
        />
      )}
    </div>
  );
}

/* ---------- Service Requests Tab ---------- */

function ServiceRequestsTab({
  homeId,
  serviceRequests,
}: {
  homeId: string;
  serviceRequests: ServiceRequest[];
}) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-orange-500/15 text-orange-200 border-orange-500/20",
      QUOTED: "bg-blue-500/15 text-blue-200 border-blue-500/20",
      ACCEPTED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
      IN_PROGRESS: "bg-purple-500/15 text-purple-200 border-purple-500/20",
      COMPLETED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
      DECLINED: "bg-red-500/15 text-red-200 border-red-500/20",
      CANCELLED: "bg-white/10 text-white/70 border-white/12",
    };

    return (
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[status] ?? styles.PENDING}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      EMERGENCY: "bg-red-600/20 text-red-100 border border-red-600/25",
      HIGH: "bg-orange-500/15 text-orange-100 border border-orange-500/20",
      NORMAL: "bg-blue-500/15 text-blue-100 border border-blue-500/20",
      LOW: "bg-white/10 text-white/70 border border-white/12",
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${styles[urgency] ?? styles.NORMAL}`}>
        {urgency}
      </span>
    );
  };

  if (!serviceRequests?.length) {
    return (
      <div className="py-10 text-center">
        <div className="mb-4 text-5xl">📝</div>
        <p className="text-lg text-white">No service requests yet.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>Your service requests to this contractor will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {serviceRequests.map((service) => (
        <Link key={service.id} href={`/home/${homeId}/service-requests/${service.id}`} className={`${cardSurface} block`}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white sm:text-lg">{service.title}</h3>
            {getStatusBadge(service.status)}
            {getUrgencyBadge(service.urgency)}
          </div>

          <p className="line-clamp-2 text-sm text-white/70">{service.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
            {service.category ? <span>{service.category}</span> : null}
            {service.desiredDate ? <span>Desired: {formatDate(service.desiredDate)}</span> : null}
            <span>Created: {formatDate(service.createdAt)}</span>
          </div>

          {service.budgetMin || service.budgetMax ? (
            <div className="mt-2 text-sm text-white/60">
              Budget: ${service.budgetMin?.toLocaleString() || "0"} – ${service.budgetMax?.toLocaleString() || "0"}
            </div>
          ) : null}

          {service.quote ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-white/70">Quote received</div>
                  <div className="mt-1 text-lg font-semibold text-white">${Number(service.quote.totalAmount).toLocaleString()}</div>
                </div>
                <div className="text-xs text-white/60">{service.quote.status}</div>
              </div>
            </div>
          ) : null}

          {service.serviceRecord ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium text-white/70">Work scheduled</div>
              <div className="mt-1 text-sm text-white/80">
                {formatDate(service.serviceRecord.serviceDate)} • {service.serviceRecord.status.replace(/_/g, " ")}
              </div>
            </div>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

/* ---------- Pending Approvals Tab (approve/reject like Completed page) ---------- */

function PendingApprovalsTab({
  homeId,
  pendingSubmissions,
  onApprove,
  onReject,
}: {
  homeId: string;
  connectionId: string;
  pendingSubmissions: PendingSubmission[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => pendingSubmissions ?? [], [pendingSubmissions]);

  if (!rows.length) {
    return (
      <div className="py-10 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <p className="text-lg text-white">No pending submissions.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>Work submissions awaiting your approval will appear here.</p>
      </div>
    );
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await onApprove(id);
    } catch (e) {
      console.error(e);
      alert("Failed to approve submission");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    setBusyId(id);
    try {
      await onReject(id);
    } catch (e) {
      console.error(e);
      alert("Failed to reject submission");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {rows.map((s) => {
        const title = s.title || s.serviceType;
        const href = `/home/${homeId}/completed-service-submissions/${s.id}`;

        const canAct = (s.kind ?? "SUBMISSION") === "SUBMISSION";

        return (
          <div key={s.id} className={cardSurface}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-white sm:text-lg">{title}</h3>
                  <span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                    Pending Approval
                  </span>
                </div>

                {s.description ? <p className="text-sm text-white/70 line-clamp-2">{s.description}</p> : null}

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
                  {s.serviceDate ? <span>Work date: {formatDate(s.serviceDate)}</span> : null}
                  {typeof s.cost === "number" ? (
                    <span className="font-medium text-emerald-200">• Cost: ${Number(s.cost).toLocaleString()}</span>
                  ) : null}
                  {s.attachmentCount > 0 ? (
                    <span className="flex items-center gap-1">
                      {s.hasImages ? "📷" : "📎"} {s.attachmentCount} {s.attachmentCount === 1 ? "file" : "files"}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4">
                  <div className={insetSurface}>
                    <Link href={href} className="text-sm text-white/80 hover:text-white transition">
                      👉 Open to review details
                    </Link>
                    <div className={`mt-1 text-xs ${textMeta}`}>Submitted: {formatDate(s.createdAt)}</div>
                  </div>
                </div>
              </div>

              {typeof s.cost === "number" ? (
                <div className="shrink-0 text-right">
                  <div className="text-xs font-medium uppercase tracking-wide text-white/55">Cost</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-200">
                    ${Number(s.cost).toLocaleString()}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Actions (match Completed page green/red) */}
            <div className="mt-5 flex flex-wrap gap-2">
              {canAct ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleApprove(s.id)}
                    disabled={busyId === s.id}
                    className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-400/15 hover:border-emerald-300/35 disabled:opacity-60"
                  >
                    ✓ Approve &amp; add to records
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReject(s.id)}
                    disabled={busyId === s.id}
                    className="rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-400/15 hover:border-red-300/35 disabled:opacity-60"
                  >
                    ✗ Reject
                  </button>
                </>
              ) : (
                <Link href={href} className={`${ctaGhost} inline-flex items-center justify-center`}>
                  Review
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}