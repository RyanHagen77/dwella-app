// app/stats/_components/ConnectionsModal.tsx
"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { glass, textMeta } from "@/lib/glass";

type ConnectionsModalProps = {
  open: boolean;
  onCloseAction: () => void;
  homeId: string;
  pendingWorkCount: number;
  loadingWork: boolean;
  pendingInvitationsCount: number;
  loadingInvites: boolean;
  pendingJobRequestsCount?: number;
  loadingJobRequests?: boolean;
  onOpenVendorsAction: () => void;
};

export function ConnectionsModal({
  open,
  onCloseAction,
  homeId,
  pendingWorkCount,
  loadingWork,
  pendingInvitationsCount,
  loadingInvites,
  pendingJobRequestsCount = 0,
  loadingJobRequests = false,
  onOpenVendorsAction,
}: ConnectionsModalProps) {
  if (!open) return null;

  const hasPendingItems =
    pendingWorkCount > 0 ||
    pendingInvitationsCount > 0 ||
    pendingJobRequestsCount > 0;

  return (
    <Modal open={open} onCloseAction={onCloseAction}>
      <div className="p-6">
        <h2 className="mb-2 text-xl font-bold text-white">Connections &amp; Work</h2>
        <p className={`mb-6 text-sm ${textMeta}`}>
          See jobs in progress and manage who you work with on this home.
        </p>

        <div className="space-y-6">
          {/* ========== PENDING ITEMS ========== */}
          {hasPendingItems && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                Needs Attention
              </h3>
              <div className="space-y-2">
                {/* Pending work submissions */}
                {pendingWorkCount > 0 && (
                  <Link
                    href={`/home/${homeId}/completed-work-submissions`}
                    onClick={onCloseAction}
                    className={`${glass} flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 hover:bg-red-500/20`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        📋 Review Completed Work
                      </p>
                      <p className={`text-xs ${textMeta}`}>
                        Contractors have submitted work for your approval.
                      </p>
                    </div>
                    <span className="ml-3 flex-shrink-0 rounded-full bg-red-500/30 px-3 py-1 text-xs font-bold text-red-100">
                      {loadingWork ? "—" : pendingWorkCount}
                    </span>
                  </Link>
                )}

                {/* Pending job requests */}
                {pendingJobRequestsCount > 0 && (
                  <Link
                    href={`/home/${homeId}/job-requests`}
                    onClick={onCloseAction}
                    className={`${glass} flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 hover:bg-blue-500/20`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        💬 Job Requests Pending
                      </p>
                      <p className={`text-xs ${textMeta}`}>
                        Waiting on quotes or your approval.
                      </p>
                    </div>
                    <span className="ml-3 flex-shrink-0 rounded-full bg-blue-500/30 px-3 py-1 text-xs font-bold text-blue-100">
                      {loadingJobRequests ? "—" : pendingJobRequestsCount}
                    </span>
                  </Link>
                )}

                {/* Pending invitations */}
                {pendingInvitationsCount > 0 && (
                  <Link
                    href={`/home/${homeId}/invitations`}
                    onClick={onCloseAction}
                    className={`${glass} flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 hover:bg-orange-500/20`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        ✉️ View Pending Invitations
                      </p>
                      <p className={`text-xs ${textMeta}`}>
                        Invites that haven&apos;t been accepted yet.
                      </p>
                    </div>
                    <span className="ml-3 flex-shrink-0 rounded-full bg-orange-500/30 px-3 py-1 text-xs font-bold text-orange-100">
                      {loadingInvites ? "—" : pendingInvitationsCount}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ========== WORK & SERVICES ========== */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
              Work &amp; Services
            </h3>
            <div className="space-y-2">
              {/* Requests & submissions */}
              <Link
                href={`/home/${homeId}/completed-work-submissions`}
                onClick={onCloseAction}
                className={`${glass} flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10`}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    📝 Manage Requests &amp; Submissions
                  </p>
                  <p className={`text-xs ${textMeta}`}>
                    Request work, track quotes, and approve jobs.
                  </p>
                </div>
                <span className="text-white/40">→</span>
              </Link>
            </div>
          </div>

          {/* ========== CONNECTIONS ========== */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
              Connections
            </h3>
            <div className="space-y-2">
              {/* Find pros (moved here, top of section) */}
              <button
                type="button"
                onClick={onOpenVendorsAction}
                className={`${glass} flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left hover:bg-white/10`}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    🔍 Find &amp; Connect Pros
                  </p>
                  <p className={`text-xs ${textMeta}`}>
                    Browse and connect with trusted contractors.
                  </p>
                </div>
                <span className="text-white/40">→</span>
              </button>

              {/* My contractors */}
              <Link
                href={`/home/${homeId}/contractors`}
                onClick={onCloseAction}
                className={`${glass} flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10`}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    👷 Manage My Contractors
                  </p>
                  <p className={`text-xs ${textMeta}`}>
                    View and manage your connected pros.
                  </p>
                </div>
                <span className="text-white/40">→</span>
              </Link>

              {/* Invitations (bottom of section) */}
              <Link
                href={`/home/${homeId}/invitations`}
                onClick={onCloseAction}
                className={`${glass} flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10`}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    ✉️ Manage Invitations
                  </p>
                  <p className={`text-xs ${textMeta}`}>
                    See all sent and received invites.
                  </p>
                </div>
                <span className="text-white/40">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCloseAction}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}