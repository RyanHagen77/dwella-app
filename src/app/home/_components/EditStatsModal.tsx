// src/app/home/_components/EditStatsModal.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button, GhostButton } from "@/components/ui/Button";
import { heading, textMeta } from "@/lib/glass";

type HomeStats = {
  healthScore: number | null;
  estValue: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  yearBuilt: number | null;
};

type EditStatsModalProps = {
  open: boolean;
  onCloseAction: () => void;
  homeId: string;
  currentStats: HomeStats;
};

/** Clean glass controls: NO rings, focus via border only */
const fieldShell =
  "rounded-2xl border border-white/20 bg-black/35 backdrop-blur transition overflow-hidden " +
  "focus-within:border-[#33C17D] focus-within:border-2";

const fieldInner =
  "w-full bg-transparent px-4 py-2 text-white outline-none placeholder:text-white/35 " +
  "border-0 ring-0 focus:ring-0 focus:outline-none " +
  "text-base sm:text-sm";

const labelCaps =
  "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

export function EditStatsModal({
  open,
  onCloseAction: onClose,
  homeId,
  currentStats,
}: EditStatsModalProps) {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const [formData, setFormData] = React.useState({
    estValue: "",
    beds: "",
    baths: "",
    sqft: "",
    yearBuilt: "",
  });

  const close = React.useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  // Reset form whenever modal opens or stats change
  React.useEffect(() => {
    if (!open) return;

    setError("");
    setLoading(false);
    setFormData({
      estValue: currentStats.estValue?.toString() ?? "",
      beds: currentStats.beds?.toString() ?? "",
      baths: currentStats.baths?.toString() ?? "",
      sqft: currentStats.sqft?.toString() ?? "",
      yearBuilt: currentStats.yearBuilt?.toString() ?? "",
    });
  }, [open, currentStats]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        estValue: formData.estValue.trim() ? Number(formData.estValue) : null,
        beds: formData.beds.trim() ? Number(formData.beds) : null,
        baths: formData.baths.trim() ? Number(formData.baths) : null,
        sqft: formData.sqft.trim() ? Number(formData.sqft) : null,
        yearBuilt: formData.yearBuilt.trim() ? Number(formData.yearBuilt) : null,
      };

      const res = await fetch(`/api/home/${homeId}/stats`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to update stats");
      }

      router.refresh();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stats");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onCloseAction={close} title="Edit Home Stats">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className={`mt-1 text-sm ${textMeta}`}>
            Update property information and statistics
          </p>
        </div>

        <label className="block">
          <span className={labelCaps}>Estimated Value ($)</span>
          <div className={fieldShell}>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={formData.estValue}
              onChange={(e) => setFormData((p) => ({ ...p, estValue: e.target.value }))}
              className={fieldInner}
              placeholder="450000"
            />
          </div>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCaps}>Bedrooms</span>
            <div className={fieldShell}>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={formData.beds}
                onChange={(e) => setFormData((p) => ({ ...p, beds: e.target.value }))}
                className={fieldInner}
                placeholder="3"
              />
            </div>
          </label>

          <label className="block">
            <span className={labelCaps}>Bathrooms</span>
            <div className={fieldShell}>
              <input
                type="number"
                min={0}
                step="0.5"
                inputMode="decimal"
                value={formData.baths}
                onChange={(e) => setFormData((p) => ({ ...p, baths: e.target.value }))}
                className={fieldInner}
                placeholder="2.5"
              />
            </div>
          </label>
        </div>

        <label className="block">
          <span className={labelCaps}>Square Feet</span>
          <div className={fieldShell}>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={formData.sqft}
              onChange={(e) => setFormData((p) => ({ ...p, sqft: e.target.value }))}
              className={fieldInner}
              placeholder="2400"
            />
          </div>
        </label>

        <label className="block">
          <span className={labelCaps}>Year Built</span>
          <div className={fieldShell}>
            <input
              type="number"
              min={1800}
              max={new Date().getFullYear()}
              inputMode="numeric"
              value={formData.yearBuilt}
              onChange={(e) => setFormData((p) => ({ ...p, yearBuilt: e.target.value }))}
              className={fieldInner}
              placeholder="1995"
            />
          </div>
        </label>

        {error ? (
          <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton type="button" onClick={close} disabled={loading}>
            Cancel
          </GhostButton>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}