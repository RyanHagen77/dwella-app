// app/home/[homeId]/contractors/[connectionId]/_components/ContractorDetailTabs.tsx
import Link from "next/link";
import { glass, textMeta } from "@/lib/glass";

type WorkRecord = {
  id: string;
  workType: string;
  description: string | null;
  workDate: string;
  cost: number | null;
  isVerified: boolean;
  status: string;
  createdAt: string;
  attachmentCount: number;
  hasImages: boolean;
  finalRecordId: string | null;
};

type JobRequest = {
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
  quote: {
    id: string;
    totalAmount: number;
    status: string;
  } | null;
  workRecord: {
    id: string;
    status: string;
    workDate: string;
  } | null;
};

type PendingSubmission = {
  id: string;
  workType: string;
  description: string | null;
  workDate: string;
  createdAt: string;
  attachmentCount: number;
  hasImages: boolean;
};

type Tab = "work-history" | "requests" | "pending";

export function ContractorDetailTabs({
  homeId,
  connectionId,
  workRecords,
  jobRequests,
  pendingSubmissions,
  activeRequestsCount,
  pendingApprovalsCount,
  activeTab,
}: {
  homeId: string;
  connectionId: string;
  workRecords: WorkRecord[];
  jobRequests: JobRequest[];
  pendingSubmissions: PendingSubmission[];
  activeRequestsCount: number;
  pendingApprovalsCount?: number;
  activeTab: Tab;
}) {
  const pendingCount = pendingApprovalsCount ?? pendingSubmissions.length;
  const baseHref = `/home/${homeId}/contractors/${connectionId}`;

  return (
    <>
      {/* Tabs */}
      <section className={glass}>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`${baseHref}?tab=work-history`}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeTab === "work-history"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Work History
            {workRecords.length > 0 && ` (${workRecords.length})`}
          </Link>

          <Link
            href={`${baseHref}?tab=requests`}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeTab === "requests"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Job Requests
            {activeRequestsCount > 0 && ` (${activeRequestsCount})`}
          </Link>

          <Link
            href={`${baseHref}?tab=pending`}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeTab === "pending"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Pending Approvals
            {pendingCount > 0 && ` (${pendingCount})`}
          </Link>
        </div>
      </section>

      {/* Content */}
      <section className={glass}>
        {activeTab === "work-history" && (
          <WorkHistoryTab workRecords={workRecords} homeId={homeId} />
        )}
        {activeTab === "requests" && (
          <JobRequestsTab jobRequests={jobRequests} homeId={homeId} />
        )}
        {activeTab === "pending" && (
          <PendingApprovalsTab
            pendingSubmissions={pendingSubmissions}
            homeId={homeId}
          />
        )}
      </section>
    </>
  );
}

/* ---------- Work History Tab ---------- */

function WorkHistoryTab({
  workRecords,
  homeId,
}: {
  workRecords: WorkRecord[];
  homeId: string;
}) {
  if (workRecords.length === 0) {
    return (
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">📋</div>
        <p className="text-lg">No work records yet.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>
          Work completed by this contractor will appear here.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (isVerified) {
      return (
        <span className="inline-block rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
          ✓ Verified
        </span>
      );
    }

    if (
      ["PENDING_REVIEW", "DOCUMENTED_UNVERIFIED", "DOCUMENTED"].includes(
        status
      )
    ) {
      return (
        <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-300">
          Pending Approval
        </span>
      );
    }

    const styles: Record<string, string> = {
      APPROVED: "bg-green-500/20 text-green-300 border-green-500/30",
      REJECTED: "bg-red-500/20 text-red-300 border-red-500/30",
      DISPUTED: "bg-red-500/20 text-red-300 border-red-500/30",
      EXPIRED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    };

    return (
      <span
        className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${
          styles[status] || "bg-gray-500/20 text-gray-300 border-gray-500/30"
        }`}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const isPendingApproval = (status: string, isVerified: boolean) =>
    !isVerified &&
    ["PENDING_REVIEW", "DOCUMENTED_UNVERIFIED", "DOCUMENTED"].includes(
      status
    );

  return (
    <div className="space-y-4">
      {workRecords.map((record) => {
        const needsApproval = isPendingApproval(
          record.status,
          record.isVerified
        );

        const href =
          record.isVerified && record.finalRecordId
            ? `/home/${homeId}/records/${record.finalRecordId}`
            : `/home/${homeId}/completed-work-submissions`;

        return (
          <Link
            key={record.id}
            href={href}
            className={`block rounded-xl p-6 transition-colors ${
              needsApproval
                ? "border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10"
                : "border border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">
                    {record.workType}
                  </h3>
                  {getStatusBadge(record.status, record.isVerified)}
                </div>
                {record.description && (
                  <p className="line-clamp-2 text-sm text-white/70">
                    {record.description}
                  </p>
                )}
              </div>
              {record.cost !== null && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-semibold text-green-400">
                    ${record.cost.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <span>
                {new Date(record.workDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {record.attachmentCount > 0 && (
                <span className="flex items-center gap-1">
                  {record.hasImages ? "📷" : "📎"} {record.attachmentCount}{" "}
                  {record.attachmentCount === 1 ? "file" : "files"}
                </span>
              )}
            </div>

            {needsApproval && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-sm text-orange-300">
                  👉 Click to review and approve this work
                </p>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/* ---------- Job Requests Tab ---------- */

function JobRequestsTab({
  jobRequests,
  homeId,
}: {
  jobRequests: JobRequest[];
  homeId: string;
}) {
  if (jobRequests.length === 0) {
    return (
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">📝</div>
        <p className="text-lg">No job requests yet.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>
          Your service requests to this contractor will appear here.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      QUOTED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      ACCEPTED: "bg-green-500/20 text-green-300 border-green-500/30",
      IN_PROGRESS:
        "bg-purple-500/20 text-purple-300 border-purple-500/30",
      COMPLETED:
        "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      DECLINED: "bg-red-500/20 text-red-300 border-red-500/30",
      CANCELLED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    };

    return (
      <span
        className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${
          styles[status] || styles.PENDING
        }`}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      EMERGENCY: "bg-red-500/20 text-red-300",
      HIGH: "bg-orange-500/20 text-orange-300",
      NORMAL: "bg-blue-500/20 text-blue-300",
      LOW: "bg-gray-500/20 text-gray-300",
    };

    return (
      <span
        className={`inline-block rounded px-2 py-0.5 text-xs ${
          styles[urgency] || styles.NORMAL
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
          <div className="mb-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                {job.title}
              </h3>
              {getStatusBadge(job.status)}
              {getUrgencyBadge(job.urgency)}
            </div>

            <p className="line-clamp-2 text-sm text-white/70">
              {job.description}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
              {job.category && <span>{job.category}</span>}
              {job.desiredDate && (
                <span>
                  Desired:{" "}
                  {new Date(job.desiredDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </span>
              )}
              <span>
                Created:{" "}
                {new Date(job.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
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
                      ${job.quote.totalAmount.toLocaleString()}
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
                  {new Date(job.workRecord.workDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}{" "}
                  • {job.workRecord.status.replace(/_/g, " ")}
                </p>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ---------- Pending Approvals Tab ---------- */

function PendingApprovalsTab({
  pendingSubmissions,
  homeId,
}: {
  pendingSubmissions: PendingSubmission[];
  homeId: string;
}) {
  if (pendingSubmissions.length === 0) {
    return (
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">✅</div>
        <p className="text-lg">No pending approvals.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>
          Work submissions from this contractor awaiting your approval will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingSubmissions.map((submission) => (
        <Link
          key={submission.id}
          href={`/home/${homeId}/completed-work-submissions`}
          className="block rounded-xl border border-orange-500/30 bg-orange-500/5 p-6 transition-colors hover:bg-orange-500/10"
        >
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">
                  {submission.workType}
                </h3>
                <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-300">
                  Awaiting Approval
                </span>
              </div>
              {submission.description && (
                <p className="line-clamp-2 text-sm text-white/70">
                  {submission.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
            <span>
              Work Date:{" "}
              {new Date(submission.workDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {submission.attachmentCount > 0 && (
              <span className="flex items-center gap-1">
                {submission.hasImages ? "📷" : "📎"}{" "}
                {submission.attachmentCount}{" "}
                {submission.attachmentCount === 1 ? "file" : "files"}
              </span>
            )}
            <span>
              Submitted:{" "}
              {new Date(submission.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-sm text-orange-300">
              👉 Click to review and approve this work
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}