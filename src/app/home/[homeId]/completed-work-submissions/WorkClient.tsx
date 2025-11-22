"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { glass, heading, textMeta, ctaPrimary } from "@/lib/glass";
import Breadcrumb from "@/components/ui/Breadcrumb";

type Connection = {
  id: string;
  contractor: {
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
  createdAt: string;
};

type PendingWorkAttachment = {
  id: string;
  filename: string;
  mimeType: string | null;
  size: number;
  url: string | null;
};

type PendingWork = {
  id: string;
  title: string;
  description: string | null;
  workDate: string;
  cost: number | null;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
    } | null;
  };
  createdAt: string;
  attachments: PendingWorkAttachment[];
};

type JobRequest = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  urgency: string;
  budgetMin: number | null;
  budgetMax: number | null;
  desiredDate: string | null;
  status: string;
  createdAt: string;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      verified: boolean;
      rating: number | null;
    } | null;
  };
  quote: {
    id: string;
    totalAmount: number;
    status: string;
    expiresAt: string | null;
  } | null;
  workRecord: {
    id: string;
    status: string;
    workDate: string;
  } | null;
};

type Tab = "requests-and-approvals" | "find-pros";

export default function WorkClient({
  homeId,
  homeAddress,
  pendingWork,
  jobRequests,
}: {
  homeId: string;
  homeAddress: string;
  connections: Connection[];
  pendingWork: PendingWork[];
  jobRequests: JobRequest[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("requests-and-approvals");

  const totalRequests = jobRequests.length;
  const totalPendingApprovals = pendingWork.length;

  return (
    <main className="relative min-h-screen text-white">
      {/* Background with gradient overlay */}
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

      <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb
        href={`/home/${homeId}`}
        label={homeAddress}
        current="Requests & Submissions"
      />

        {/* Header */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl font-bold ${heading}`}>
                  Requests & Submissions
                </h1>
                <p className={`text-sm ${textMeta} mt-1`}>
                  {totalRequests} {totalRequests === 1 ? "request" : "requests"} • {totalPendingApprovals} pending {totalPendingApprovals === 1 ? "submission" : "submissions"}
                </p>
              </div>
            </div>

            {/* Request Work Button */}
            <div className="flex-shrink-0">
              <Link
                href={`/home/${homeId}/job-requests/new`}
                className={ctaPrimary}
              >
                + Request Work
              </Link>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className={glass}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("requests-and-approvals")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeTab === "requests-and-approvals"
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Requests &amp; Submissions
              {totalRequests + totalPendingApprovals > 0 &&
                ` (${totalRequests + totalPendingApprovals})`}
            </button>

            <button
              onClick={() => setActiveTab("find-pros")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeTab === "find-pros"
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Find Pros
            </button>
          </div>
        </section>

        {/* Content */}
        <section className={glass}>
          {activeTab === "requests-and-approvals" && (
            <RequestsAndApprovalsTab
              jobRequests={jobRequests}
              pendingWork={pendingWork}
              homeId={homeId}
            />
          )}

          {activeTab === "find-pros" && <FindProsTab homeId={homeId} />}
        </section>
      </div>
    </main>
  );
}

/* ---------- Combined Requests & Pending Tab ---------- */

function RequestsAndApprovalsTab({
  jobRequests,
  pendingWork,
  homeId,
}: {
  jobRequests: JobRequest[];
  pendingWork: PendingWork[];
  homeId: string;
}) {
  const hasAny = jobRequests.length > 0 || pendingWork.length > 0;

  if (!hasAny) {
    return (
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">🔨</div>
        <p className="text-lg">No requests or pending work yet.</p>
        <p className={`mt-1 text-sm ${textMeta}`}>
          Request service from your connected pros and approve their submitted
          work here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {jobRequests.length > 0 && (
        <div>
          <h2 className="mb-2 text-base font-semibold text-white">
            Service Requests
          </h2>
          <p className={`mb-4 text-sm ${textMeta}`}>
            Track your requests, quotes, and scheduled work.
          </p>
          <RequestedJobsTab jobRequests={jobRequests} homeId={homeId} />
        </div>
      )}

      {pendingWork.length > 0 && (
        <>
          <div className="h-px bg-white/10" />
          <div>
            <h2 className="mb-2 text-base font-semibold text-white">
              Pending Completed Work Submissions
            </h2>
            <p className={`mb-4 text-sm ${textMeta}`}>
              Review contractor-submitted work and add it to your records.
            </p>
            <PendingWorkTab pendingWork={pendingWork} homeId={homeId} />
          </div>
        </>
      )}
    </div>
  );
}


/* ---------- Requested Jobs Tab (same logic) ---------- */

function RequestedJobsTab({
  jobRequests,
  homeId,
}: {
  jobRequests: JobRequest[];
  homeId: string;
}) {
  if (jobRequests.length === 0) {
    return (
      <div className="py-6 text-center text-white/80">
        <div className="mb-2 text-4xl">📋</div>
        <p className="text-base">No job requests yet.</p>
        <p className={`mt-1 text-sm ${textMeta}`}>
          Request service from your connected pros to get started.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      QUOTED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      ACCEPTED: "bg-green-500/20 text-green-300 border-green-500/30",
      IN_PROGRESS: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      COMPLETED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      DECLINED: "bg-red-500/20 text-red-300 border-red-500/30",
      CANCELLED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    };

    return (
      <span
        className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.PENDING
        }`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      URGENT: "bg-red-500/20 text-red-300",
      HIGH: "bg-orange-500/20 text-orange-300",
      NORMAL: "bg-blue-500/20 text-blue-300",
      LOW: "bg-gray-500/20 text-gray-300",
    };

    return (
      <span
        className={`inline-block rounded px-2 py-0.5 text-xs ${
          styles[urgency as keyof typeof styles] || styles.NORMAL
        }`}
      >
        {urgency}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {jobRequests.map((job) => (
        <Link
          key={job.id}
          href={`/home/${homeId}/job-requests/${job.id}`}
          className="block rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-white">
                  {job.title}
                </h3>
                {getStatusBadge(job.status)}
                {getUrgencyBadge(job.urgency)}
              </div>

              <p className="text-sm text-white/70 line-clamp-2">
                {job.description}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
                {job.contractor.image && (
                  <Image
                    src={job.contractor.image}
                    alt={job.contractor.name || job.contractor.email}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span>
                  {job.contractor.name || job.contractor.email}
                  {job.contractor.proProfile?.businessName &&
                    ` (${job.contractor.proProfile.businessName})`}
                </span>
                {job.category && <span>• {job.category}</span>}
                {job.desiredDate && (
                  <span>
                    • Desired:{" "}
                    {new Date(job.desiredDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {(job.budgetMin || job.budgetMax) && (
                <div className="mt-2 text-sm text-white/60">
                  Budget: ${job.budgetMin?.toLocaleString() || "0"} - $
                  {job.budgetMax?.toLocaleString() || "0"}
                </div>
              )}

              {job.quote && (
                <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-300">
                        Quote Received
                      </p>
                      <p className="text-lg font-bold text-white">
                        ${Number(job.quote.totalAmount).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs text-blue-300/80">
                      {job.quote.status}
                    </span>
                  </div>
                </div>
              )}

              {job.workRecord && (
                <div className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                  <p className="text-sm font-medium text-green-300">
                    Work Scheduled
                  </p>
                  <p className="text-sm text-white/80">
                    {new Date(job.workRecord.workDate).toLocaleDateString()} •{" "}
                    {job.workRecord.status}
                  </p>
                </div>
              )}
            </div>

            <div className="text-xs text-white/50">
              {new Date(job.createdAt).toLocaleDateString()}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ---------- Pending Work Tab (same logic as before, with <Image>) ---------- */

function PendingWorkTab({
  pendingWork,
  homeId,
}: {
  pendingWork: PendingWork[];
  homeId: string;
}) {
  const router = useRouter();

  async function handleApprove(workId: string) {
    try {
      const res = await fetch(`/api/home/${homeId}/completed-work-submissions/${workId}/approve`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to approve work");

      alert("Work approved and added to your records!");
      router.refresh();
    } catch (error) {
      console.error("Error approving work:", error);
      alert("Failed to approve work");
    }
  }

  async function handleReject(workId: string) {
    if (!confirm("Are you sure you want to reject this work?")) return;

    try {
      const res = await fetch(`/api/home/${homeId}/work/${workId}/reject`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to reject work");

      alert("Work rejected.");
      router.refresh();
    } catch (error) {
      console.error("Error rejecting work:", error);
      alert("Failed to reject work");
    }
  }

  if (pendingWork.length === 0) {
    return (
      <div className="py-6 text-center text-white/80">
        <div className="mb-2 text-4xl">✅</div>
        <p className="text-base">No pending work to review.</p>
        <p className={`mt-1 text-sm ${textMeta}`}>
          When contractors complete work, it will appear here for your
          approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingWork.map((work) => {
        const hasImages = work.attachments.some((a) =>
          a.mimeType?.startsWith("image/")
        );
        const hasDocs = work.attachments.some(
          (a) => a.mimeType && !a.mimeType.startsWith("image/")
        );

        return (
          <div
            key={work.id}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {work.title}
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  By: {work.contractor.name || work.contractor.email}
                  {work.contractor.proProfile?.businessName &&
                    ` (${work.contractor.proProfile.businessName})`}
                </p>
                {work.workDate && (
                  <p className="mt-1 text-sm text-white/60">
                    Work Date:{" "}
                    {new Date(work.workDate).toLocaleDateString()}
                  </p>
                )}
                {work.cost !== null && (
                  <p className="mt-1 text-sm font-medium text-green-300">
                    Cost: ${Number(work.cost).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {work.description && (
              <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-white/80">
                  {work.description}
                </p>
              </div>
            )}

            {/* Attachments preview */}
            {work.attachments.length > 0 && (
              <div className="mb-4 space-y-4">
                {hasImages && (
                  <div>
                    <h4 className={`mb-2 text-sm font-medium ${textMeta}`}>
                      Photos
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {work.attachments
                        .filter((a) => a.mimeType?.startsWith("image/"))
                        .map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/home/${homeId}/attachments/${attachment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:opacity-90"
                          >
                            <Image
                              src={`/api/home/${homeId}/attachments/${attachment.id}`}
                              alt={attachment.filename}
                              fill
                              sizes="200px"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                              <span className="text-xs text-white opacity-0 group-hover:opacity-100">
                                View
                              </span>
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {hasDocs && (
                  <div>
                    <h4 className={`mb-2 text-sm font-medium ${textMeta}`}>
                      Documents
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {work.attachments
                        .filter(
                          (a) =>
                            a.mimeType && !a.mimeType.startsWith("image/")
                        )
                        .map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/home/${homeId}/attachments/${attachment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-white/10">
                              {attachment.mimeType?.includes("pdf") ? (
                                <span className="text-xl">📄</span>
                              ) : (
                                <span className="text-xl">📎</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-white">
                                {attachment.filename}
                              </p>
                              <p className="text-xs text-white/60">
                                {(attachment.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(work.id)}
                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-green-600 hover:to-emerald-600"
              >
                ✓ Approve &amp; Add to Records
              </button>
              <button
                onClick={() => handleReject(work.id)}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
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

/* ---------- Find Pros Tab ---------- */

function FindProsTab({ homeId }: { homeId: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mb-4 text-5xl">🔍</div>
      <p className="mb-2 text-lg text-white/80">Find and invite contractors</p>
      <p className={`mb-6 text-sm ${textMeta}`}>
        Invite trusted pros to connect to this home
      </p>
      <Link
        href={`/home/${homeId}/invitations`}
        className={`${ctaPrimary} inline-block`}
      >
        Invite a Pro
      </Link>
    </div>
  );
}