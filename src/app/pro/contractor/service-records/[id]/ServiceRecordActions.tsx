"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ctaGhost } from "@/lib/glass";
import { EditServiceRecordModal } from "./EditServiceRecordModal";

type ServiceRecordData = {
  id: string;
  serviceType: string;
  serviceDate: string;
  description: string;
  cost: number | null;
  status: string;
};

type Props = {
  serviceRecordId: string;
  serviceRecord: ServiceRecordData;
  variant?: "default" | "header";
};

export function ServiceRecordActions({
  serviceRecordId,
  serviceRecord,
  variant = "default",
}: Props) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    };
  }, []);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/pro/contractor/service-records/${serviceRecordId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "Failed to delete service record");
      }

      router.push("/pro/contractor/service-records");
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete service record. Please try again."
      );
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  function requestConfirmDelete() {
    setShowConfirm(true);

    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = window.setTimeout(() => {
      setShowConfirm(false);
      confirmTimerRef.current = null;
    }, 3000);
  }

  function onDeleteClick() {
    if (deleting) return;

    if (showConfirm) {
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
      void handleDelete();
      return;
    }

    requestConfirmDelete();
  }

  const isHeader = variant === "header";

  const editClass = useMemo(() => {
    // Header variant: compact pill buttons (prevents ugly wrapping in tight headers)
    if (isHeader) {
      return [
        "inline-flex items-center justify-center",
        "h-9 px-4",
        "rounded-full",
        "border border-white/25",
        "bg-white/10",
        "text-xs font-medium text-white/90",
        "hover:bg-white/15 transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      ].join(" ");
    }
    return ctaGhost;
  }, [isHeader]);

  const deleteTone = showConfirm
    ? "border-red-400/50 bg-red-500/30 text-red-200 hover:bg-red-500/40"
    : "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20";

  const deleteClass = useMemo(() => {
    const base = isHeader
      ? "inline-flex items-center justify-center h-9 px-4 rounded-full text-xs font-medium"
      : "px-3 py-2 text-sm rounded-lg";

    return [
      base,
      "border transition-colors",
      deleteTone,
      "disabled:opacity-50 disabled:cursor-not-allowed",
    ].join(" ");
  }, [isHeader, deleteTone]);

  return (
    <>
      <div className={isHeader ? "flex items-center gap-2 whitespace-nowrap" : "flex items-center gap-2"}>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className={editClass}
          disabled={deleting}
        >
          Edit
        </button>

        <button
          type="button"
          onClick={onDeleteClick}
          disabled={deleting}
          aria-live="polite"
          className={deleteClass}
        >
          {deleting ? "Deleting..." : showConfirm ? "Confirm?" : "Delete"}
        </button>
      </div>

      <EditServiceRecordModal
        open={editOpen}
        onCloseAction={() => setEditOpen(false)}
        serviceRecord={serviceRecord}
        serviceRecordId={serviceRecordId}
      />
    </>
  );
}