"use client";

import { useEffect, useRef, useState } from "react";
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    };
  }, []);

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
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ctaGhost} onClick={() => setEditOpen(true)} disabled={deleting}>
          Edit
        </button>

        <button
          type="button"
          disabled={deleting}
          className={[
            "rounded-full border px-4 py-2 text-sm transition disabled:opacity-60",
            confirmDelete
              ? "border-red-400/45 bg-red-500/20 text-red-100 hover:bg-red-500/30"
              : "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/15",
          ].join(" ")}
          onClick={() => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
              confirmTimerRef.current = window.setTimeout(() => setConfirmDelete(false), 2500);
              return;
            }
            void handleDelete();
          }}
        >
          {deleting ? "Deleting…" : confirmDelete ? "Confirm?" : "Delete"}
        </button>
      </div>

      <EditWarrantyModal open={editOpen} onClose={() => setEditOpen(false)} warranty={warranty as any} homeId={homeId} />
    </>
  );
}