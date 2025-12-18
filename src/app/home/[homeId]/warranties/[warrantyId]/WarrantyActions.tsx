"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ctaGhost } from "@/lib/glass";
import { EditWarrantyModal } from "../_components/EditWarrantyModal";

export type WarrantyDetail = {
  id: string;
  item: string;
  provider: string | null;
  policyNo: string | null;
  expiresAt: string | Date | null;
  note: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  formattedExpiry: string;
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number | null;
    uploadedBy: string;
  }>;
};

export function WarrantyActions({
  homeId,
  warranty,
}: {
  homeId: string;
  warranty: WarrantyDetail;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    try {
      const res = await fetch(`/api/home/${homeId}/warranties/${warranty.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete warranty");
      }

      router.push(`/home/${homeId}/warranties`);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to delete warranty.");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button className={ctaGhost} onClick={() => setEditOpen(true)}>
          Edit
        </button>

        {showConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/15"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-red-400/30 bg-red-500/20 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/20"
          >
            Delete
          </button>
        )}
      </div>

      <EditWarrantyModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        warranty={warranty}
        homeId={homeId}
      />
    </>
  );
}