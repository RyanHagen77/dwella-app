/**
 * ADMIN CONTRACTOR FILTERS
 *
 * Search and type filtering for contractors list.
 *
 * Location: app/admin/contractors/_components/ContractorFilters.tsx
 */

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { glassTight, textMeta } from "@/lib/glass";

type Props = {
  search: string;
  type: string;
  status: string;
};

const types = [
  { value: "all", label: "All Types" },
  { value: "contractor", label: "Contractor" },
  { value: "realtor", label: "Realtor" },
  { value: "inspector", label: "Inspector" },
];

export default function ContractorFilters({ search, type, status }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams();

    const current = { search: searchInput, type, status, ...updates };

    if (current.search) params.set("search", current.search);
    if (current.type && current.type !== "all") params.set("type", current.type);
    if (current.status) params.set("status", current.status);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const clearSearch = () => {
    setSearchInput("");
    updateFilters({ search: "" });
  };

  return (
    <div className={`${glassTight} space-y-4`}>
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or business..."
            className="h-10 w-full rounded-lg border border-white/20 bg-black/30 pl-9 pr-9 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          {searchInput && (
            <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              <X size={14} />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <span className={`text-xs ${textMeta} hidden sm:inline`}>Type</span>
          <select
            value={type}
            onChange={(e) => updateFilters({ type: e.target.value })}
            className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white/90 backdrop-blur focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            {types.map((t) => (
              <option key={t.value} value={t.value} className="bg-gray-900">{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isPending && (
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-white/30" />
        </div>
      )}
    </div>
  );
}