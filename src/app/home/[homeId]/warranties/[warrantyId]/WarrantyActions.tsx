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
    url: string; // ✅ always string
    mimeType: string | null;
    size: number | bigint | null;
    uploadedBy: string;
  }>;
};

type Props = {
  homeId: string;
  warranty: WarrantyDetail;
};

export function WarrantyActions({ homeId, warranty }: Props) {
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/warranties/${warranty.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete warranty");

      router.push(`/home/${homeId}/warranties`);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to delete warranty. Please try again.");
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={ctaGhost}
          onClick={() => setEditOpen(true)}
          disabled={deleting}
        >
          Edit
        </button>

        {showConfirm ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full border border-red-400/35 bg-red-500/15 px-4 py-2 text-sm text-red-100 transition-colors hover:bg-red-500/25 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Confirm delete"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={deleting}
            className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-60"
          >
            Delete
          </button>
        )}
      </div>

      <EditWarrantyModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        warranty={warranty as any}
        homeId={homeId}
      />
    </>
  );
}