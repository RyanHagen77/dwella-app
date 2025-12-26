"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ctaGhost } from "@/lib/glass";
import { EditRecordModal } from "@/app/home/[homeId]/records/_components/EditRecordModal";

type RecordData = {
  id: string;
  title: string;
  date: Date | null;
  kind: string | null;
  vendor: string | null;
  cost: number | null;
  note: string | null;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string | null;
    mimeType: string | null;
    size: number;
    uploadedBy: string;
  }>;
};

type Props = {
  recordId: string;
  homeId: string;
  record: RecordData;
};

export function RecordActions({ recordId, homeId, record }: Props) {
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
      const res = await fetch(`/api/home/${homeId}/records/${recordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");

      router.push(`/home/${homeId}/records`);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to delete record. Please try again.");
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

      <EditRecordModal open={editOpen} onClose={() => setEditOpen(false)} record={record as any} homeId={homeId} />
    </>
  );
}