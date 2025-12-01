/**
 * ADMIN HOME FILTERS
 *
 * Search and sort controls for homes list.
 *
 * Location: app/admin/homes/_components/HomeFilters.tsx
 */

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { glassTight, textMeta } from "@/lib/glass";

type Props = {
  search: string;
  sort: string;
  order: string;
};

const sortOptions = [
  { value: "createdAt", label: "Date Added" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
];

export default function HomeFilters({ search, sort, order }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams();
    const current = { search: searchInput, sort, order, ...updates };

    if (current.search) params.set("search", current.search);
    if (current.sort && current.sort !== "createdAt") params.set("sort", current.sort);
    if (current.order && current.order !== "desc") params.set("order", current.order);

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
            placeholder="Search by address, city, state, or owner..."
            className="h-10 w-full rounded-lg border border-white/20 bg-black/30 pl-9 pr-9 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          {searchInput && (
            <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              <X size={14} />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <span className={"text-xs hidden sm:inline " + textMeta}>Sort</span>
          <select
            value={sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white/90 backdrop-blur focus:border-white/40 focus:outline-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-900">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => updateFilters({ order: order === "asc" ? "desc" : "asc" })}
          className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white/80 transition-colors hover:bg-white/20"
        >
          {order === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
      </div>

      {isPending && (
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-white/30" />
        </div>
      )}
    </div>
  );
}