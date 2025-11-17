// app/home/_components/ConnectionsModal.tsx
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
  onOpenShare: () => void;
  onOpenVendors: () => void;
};

export function ConnectionsModal({
  open,
  onCloseAction,
  homeId,
  pendingWorkCount,
  loadingWork,
  pendingInvitationsCount,
  loadingInvites,
  onOpenShare,
  onOpenVendors,
}: ConnectionsModalProps) {
  if (!open) return null;

  return (
    <Modal open={open} onCloseAction={onCloseAction}>
      <div className="p-6">
        <h2 className="mb-2 text-xl font-bold text-white">Connections</h2>
        <p className={`mb-4 text-sm ${textMeta}`}>
          Manage pros, invitations, and work tied to this home.
        </p>

        <div className="space-y-3">
          {/* Invitations */}
          <Link
            href={`/home/${homeId}/invitations`}
            onClick={onCloseAction}
            className={`${glass} flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10`}
          >
            <div>
              <p className="text-sm font-medium text-white">Invitations</p>
              <p className={`text-xs ${textMeta}`}>
                Invitations you&apos;ve sent and contractor invites you&apos;ve
                received.
              </p>
            </div>
            <span className="ml-3 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
              {loadingInvites ? "—" : `${pendingInvitationsCount} pending`}
            </span>
          </Link>

          {/* Work - Updated to go to /work page */}
          <Link
            href={`/home/${homeId}/work`}
            onClick={onCloseAction}
            className={`${glass} flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10`}
          >
            <div>
              <p className="text-sm font-medium text-white">Work & Services</p>
              <p className={`text-xs ${textMeta}`}>
                Request service, review pending work, and find new pros.
              </p>
            </div>
            <span className="ml-3 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200">
              {loadingWork ? "—" : `${pendingWorkCount} items`}
            </span>
          </Link>

          {/* Share access */}
          <button
            type="button"
            onClick={onOpenShare}
            className={`${glass} flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left hover:bg-white/10`}
          >
            <div>
              <p className="text-sm font-medium text-white">Share Access</p>
              <p className={`text-xs ${textMeta}`}>
                Give a partner, co-owner, or assistant access to this home.
              </p>
            </div>
          </button>

          {/* Find vendors */}
          <button
            type="button"
            onClick={onOpenVendors}
            className={`${glass} flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left hover:bg-white/10`}
          >
            <div>
              <p className="text-sm font-medium text-white">Find Pros</p>
              <p className={`text-xs ${textMeta}`}>
                Browse recommended vendors for future work.
              </p>
            </div>
          </button>
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