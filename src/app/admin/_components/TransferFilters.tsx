/**
 * ADMIN TRANSFER FILTERS
 *
 * Search controls for transfers list.
 *
 * Location: app/admin/transfers/_components/TransferFilters.tsx
 */

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { glassTight } from "@/lib/glass";

type Props = {
  search: string;
  status: string;
  homeId: string;
};

export default function TransferFilters({ search, status, homeId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams();
    const current = { search: searchInput, status, homeId, ...updates };

    if (current.search) params.set("search", current.search);
    if (current.status && current.status !== "all") params.set("status", current.status);
    if (current.homeId) params.set("homeId", current.homeId);

    startTransition(() => {
      router.push(pathname + "?" + params.toString());
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search: searchInput });
  }

  function clearSearch() {
    setSearchInput("");
    updateFilters({ search: "" });
  }

  return (
    <div className={glassTight + " space-y-4"}>
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email, address, or sender..."
            className="h-10 w-full rounded-lg border border-white/20 bg-black/30 pl-9 pr-9 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          {searchInput && (
            <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              <X size={14} />
            </button>
          )}
        </form>

        {homeId && (
          <button
            type="button"
            onClick={() => updateFilters({ homeId: "" })}
            className="h-10 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 text-sm text-blue-400 transition-colors hover:bg-blue-500/20"
          >
            Clear home filter ×
          </button>
        )}
      </div>

      {isPending && (
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-white/30" />
        </div>
      )}
    </div>
  );
}