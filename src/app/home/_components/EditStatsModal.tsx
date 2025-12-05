"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
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

export function EditStatsModal({
  open,
  onCloseAction,
  homeId,
  currentStats,
}: EditStatsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    estValue: currentStats.estValue?.toString() || "",
    beds: currentStats.beds?.toString() || "",
    baths: currentStats.baths?.toString() || "",
    sqft: currentStats.sqft?.toString() || "",
    yearBuilt: currentStats.yearBuilt?.toString() || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        estValue: formData.estValue ? Number(formData.estValue) : null,
        beds: formData.beds ? Number(formData.beds) : null,
        baths: formData.baths ? Number(formData.baths) : null,
        sqft: formData.sqft ? Number(formData.sqft) : null,
        yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : null,
      };

      const res = await fetch(`/api/home/${homeId}/stats`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update stats");
      }

      router.refresh();
      onCloseAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stats");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <Modal open={open} onCloseAction={onCloseAction}>
      <div className="p-6">
        <h2 className={`mb-2 text-xl font-bold ${heading}`}>Edit Home Stats</h2>
        <p className={`mb-6 text-sm ${textMeta}`}>
          Update property information and statistics
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Estimated Value */}
          <div>
            <label className="mb-1 block text-sm font-medium text-white">
              Estimated Value ($)
            </label>
            <input
              type="number"
              min="0"
              value={formData.estValue}
              onChange={(e) =>
                setFormData({ ...formData, estValue: e.target.value })
              }
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              placeholder="450000"
            />
          </div>

          {/* Beds & Baths */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Bedrooms
              </label>
              <input
                type="number"
                min="0"
                value={formData.beds}
                onChange={(e) =>
                  setFormData({ ...formData, beds: e.target.value })
                }
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                placeholder="3"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Bathrooms
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.baths}
                onChange={(e) =>
                  setFormData({ ...formData, baths: e.target.value })
                }
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                placeholder="2.5"
              />
            </div>
          </div>

          {/* Square Feet */}
          <div>
            <label className="mb-1 block text-sm font-medium text-white">
              Square Feet
            </label>
            <input
              type="number"
              min="0"
              value={formData.sqft}
              onChange={(e) =>
                setFormData({ ...formData, sqft: e.target.value })
              }
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              placeholder="2400"
            />
          </div>

          {/* Year Built */}
          <div>
            <label className="mb-1 block text-sm font-medium text-white">
              Year Built
            </label>
            <input
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={formData.yearBuilt}
              onChange={(e) =>
                setFormData({ ...formData, yearBuilt: e.target.value })
              }
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              placeholder="1995"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-[rgba(243,90,31,0.85)] to-[rgba(243,90,31,0.75)] px-4 py-2 font-medium text-white hover:from-[rgba(243,90,31,0.95)] hover:to-[rgba(243,90,31,0.85)] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onCloseAction}
              disabled={loading}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}