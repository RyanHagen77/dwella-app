"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { glass, glassTight, ctaGhost } from "@/lib/glass";
import { Input, Select } from "@/components/ui";
import { EditWarrantyModal } from "./_components/EditWarrantyModal";

export type WarrantyItem = {
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

type Props = {
  warranties: WarrantyItem[];
  homeId: string;
  initialSearch?: string;
  initialSort?: string;
};

export function WarrantiesPageClient({
  warranties,
  homeId,
  initialSearch,
  initialSort,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch || "");
  const [sort, setSort] = useState(initialSort || "soonest");

  function updateFilters(updates: { search?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams?.toString());

    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search);
      } else {
        params.delete("search");
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== "soonest") {
        params.set("sort", updates.sort);
      } else {
        params.delete("sort");
      }
    }

    const queryString = params.toString();
    router.push(`/home/${homeId}/warranties${queryString ? `?${queryString}` : ""}`);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    const timeoutId = setTimeout(() => {
      updateFilters({ search: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  }

  function handleSortChange(value: string) {
    setSort(value);
    updateFilters({ sort: value });
  }

  return (
    <>
      <section className={glass}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Search</label>
            <Input
              type="text"
              placeholder="Search warranties..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Sort By</label>
            <Select value={sort} onChange={(e) => handleSortChange(e.target.value)}>
              <option value="soonest">Expiring Soonest</option>
              <option value="latest">Expiring Latest</option>
              <option value="item">Item (A-Z)</option>
            </Select>
          </div>
        </div>
      </section>

      <section className={glass}>
        {warranties.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-white/70 mb-4">
              {search ? "No warranties match your search" : "No warranties yet"}
            </p>
            <Link href={`/home/${homeId}`} className={ctaGhost}>
              {search ? "Clear Search" : "+ Add Your First Warranty"}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {warranties.map((warranty) => (
              <WarrantyCard key={warranty.id} warranty={warranty} homeId={homeId} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function WarrantyCard({ warranty, homeId }: { warranty: WarrantyItem; homeId: string }) {
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
      if (!res.ok) throw new Error("Failed to delete warranty");
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete warranty. Please try again.");
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  const tint = warranty.isExpired
    ? "border-red-400/30 bg-red-500/5"
    : warranty.isExpiringSoon
    ? "border-yellow-400/30 bg-yellow-500/5"
    : "";

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/home/${homeId}/warranties/${warranty.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(`/home/${homeId}/warranties/${warranty.id}`);
          }
        }}
        className={`${glassTight} ${tint} cursor-pointer flex items-start justify-between gap-4 transition-colors hover:bg-white/10`}
      >
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="font-medium text-white text-lg truncate">{warranty.item}</h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {warranty.provider && <span className="text-white/70">🏢 {warranty.provider}</span>}
            {warranty.policyNo && <span className="text-white/70">📋 {warranty.policyNo}</span>}
            <span className={`font-medium ${warranty.isExpired ? "text-red-400" : warranty.isExpiringSoon ? "text-yellow-400" : "text-white/90"}`}>
              📅 {warranty.formattedExpiry}
            </span>

            {warranty.expiresAt && (
              <span className={`text-xs ${warranty.isExpiringSoon ? "text-yellow-400" : warranty.isExpired ? "text-red-400" : "text-white/60"}`}>
                {warranty.isExpired ? (
                  Math.abs(warranty.daysUntilExpiry) === 1 ? "Expired 1 day ago" : `Expired ${Math.abs(warranty.daysUntilExpiry)} days ago`
                ) : warranty.daysUntilExpiry === 0 ? (
                  "Expires today"
                ) : warranty.daysUntilExpiry === 1 ? (
                  "Expires tomorrow"
                ) : (
                  `Expires in ${warranty.daysUntilExpiry} days`
                )}
              </span>
            )}
          </div>

          {warranty.note && <p className="text-sm text-white/70 line-clamp-1">{warranty.note}</p>}

          {warranty.attachments?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span>📎</span>
              <span>
                {warranty.attachments.length} attachment{warranty.attachments.length > 1 ? "s" : ""}
              </span>

              {warranty.attachments.slice(0, 3).map((att) => (
                <a
                  key={att.id}
                  href={`/api/home/${homeId}/attachments/${att.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-white/90 underline"
                >
                  {att.filename.length > 15 ? att.filename.slice(0, 12) + "..." : att.filename}
                </a>
              ))}

              {warranty.attachments.length > 3 && <span>+{warranty.attachments.length - 3} more</span>}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {warranty.isExpired && (
            <span className="inline-flex items-center px-2 py-1.5 rounded text-xs font-medium bg-red-400/20 text-red-300 border border-red-400/30">
              Expired
            </span>
          )}
          {warranty.isExpiringSoon && (
            <span className="inline-flex items-center px-2 py-1.5 rounded text-xs font-medium bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
              Expiring Soon
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
            className="px-3 py-1.5 text-sm rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors text-white"
          >
            Edit
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (showConfirm) {
                handleDelete();
              } else {
                setShowConfirm(true);
                setTimeout(() => setShowConfirm(false), 3000);
              }
            }}
            disabled={deleting}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              showConfirm
                ? "border-red-400/50 bg-red-500/30 text-red-200 hover:bg-red-500/40"
                : "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            } disabled:opacity-50`}
          >
            {deleting ? "Deleting..." : showConfirm ? "Confirm Delete?" : "Delete"}
          </button>
        </div>
      </div>

      <EditWarrantyModal
        open={editOpen}
        onCloseAction={() => setEditOpen(false)}
        warranty={warranty}
        homeId={homeId}
      />
    </>
  );
}