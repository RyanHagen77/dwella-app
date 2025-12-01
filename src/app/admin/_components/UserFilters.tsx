/**
 * ADMIN USER FILTERS
 *
 * Client component for filtering users table.
 * Handles search, role, status, and sort options.
 *
 * Location: app/admin/users/_components/UserFilters.tsx
 */

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { glassTight, textMeta } from "@/lib/glass";

type Props = {
  search: string;
  role: string;
  status: string;
  sort: string;
  order: string;
};

const roles = [
  { value: "all", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "PRO", label: "Professional" },
  { value: "HOMEOWNER", label: "Homeowner" },
];

const statuses = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const sortOptions = [
  { value: "createdAt", label: "Date Joined" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
];

export default function UserFilters({ search, role, status, sort, order }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams();

    const current = {
      search: searchInput,
      role,
      status,
      sort,
      order,
      ...updates,
    };

    if (current.search) params.set("search", current.search);
    if (current.role && current.role !== "all") params.set("role", current.role);
    if (current.status && current.status !== "all") params.set("status", current.status);
    if (current.sort && current.sort !== "createdAt") params.set("sort", current.sort);
    if (current.order && current.order !== "desc") params.set("order", current.order);

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

  const clearAllFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = search || role !== "all" || status !== "all";

  return (
    <div className={`${glassTight} space-y-4`}>
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="h-10 w-full rounded-lg border border-white/20 bg-black/30 pl-9 pr-9 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <FilterSelect label="Role" value={role} options={roles} onChange={(v) => updateFilters({ role: v })} />
        <FilterSelect label="Status" value={status} options={statuses} onChange={(v) => updateFilters({ status: v })} />
        <FilterSelect label="Sort" value={sort} options={sortOptions} onChange={(v) => updateFilters({ sort: v })} />

        <button
          type="button"
          onClick={() => updateFilters({ order: order === "asc" ? "desc" : "asc" })}
          className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white/80 transition-colors hover:bg-white/20"
        >
          {order === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="h-10 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-sm text-red-400 transition-colors hover:bg-red-500/20"
          >
            Clear All
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

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs ${textMeta} hidden sm:inline`}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white/90 backdrop-blur focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}