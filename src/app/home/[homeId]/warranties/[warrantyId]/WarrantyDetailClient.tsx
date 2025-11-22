"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { glass, ctaGhost } from "@/lib/glass";
import { EditWarrantyModal } from "../_components/EditWarrantyModal"; // adjust if your path differs

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
  }>;
};

export default function WarrantyDetailClient({
  homeId,
  warranty,
}: {
  homeId: string;
  warranty: WarrantyDetail;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this warranty?")) return;
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

  const badgeStyles = warranty.isExpired
    ? "bg-red-400/20 text-red-300 border-red-400/30"
    : warranty.isExpiringSoon
    ? "bg-yellow-400/20 text-yellow-300 border-yellow-400/30"
    : "bg-emerald-400/15 text-emerald-200 border-emerald-400/30";

  return (
    <>
      <section className={glass}>
        <div className="space-y-4">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${badgeStyles}`}
            >
              {warranty.isExpired
                ? "Expired"
                : warranty.isExpiringSoon
                ? "Expiring Soon"
                : "Active"}
            </span>

            {warranty.expiresAt && isFinite(warranty.daysUntilExpiry) && (
              <span className="text-xs text-white/70">
                {warranty.isExpired
                  ? `Expired ${Math.abs(warranty.daysUntilExpiry)} days ago`
                  : warranty.daysUntilExpiry === 0
                  ? "Expires today"
                  : warranty.daysUntilExpiry === 1
                  ? "Expires tomorrow"
                  : `Expires in ${warranty.daysUntilExpiry} days`}
              </span>
            )}
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Item" value={warranty.item} />
            <Field label="Provider" value={warranty.provider || "—"} />
            <Field label="Policy #" value={warranty.policyNo || "—"} />
            <Field label="Expires" value={warranty.formattedExpiry} />
          </div>

          {/* Note */}
          {warranty.note && (
            <div>
              <p className="mb-1 text-xs font-semibold text-white/70">Notes</p>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80 leading-relaxed">
                {warranty.note}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <p className="mb-2 text-xs font-semibold text-white/70">
              Attachments
            </p>

            {warranty.attachments.length === 0 ? (
              <p className="text-sm text-white/60">No attachments.</p>
            ) : (
              <div className="space-y-2">
                {warranty.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">
                        {att.filename}
                      </p>
                      <p className="text-xs text-white/60">
                        {att.mimeType}
                        {att.size != null ? ` • ${(att.size / 1024).toFixed(1)} KB` : ""}
                      </p>
                    </div>

                    <Link
                      href={`/api/home/${homeId}/attachments/${att.id}`}
                      target="_blank"
                      className={ctaGhost}
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setEditOpen(true)}
              className="px-3 py-2 text-sm rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors text-white"
            >
              Edit
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-2 text-sm rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </section>

      <EditWarrantyModal
        open={editOpen}
        onCloseAction={() => setEditOpen(false)}
        warranty={warranty}
        homeId={homeId}
      />
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/90 break-words">{value}</p>
    </div>
  );
}