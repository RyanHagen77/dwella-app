"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { glass } from "@/lib/glass";
import { Input, Select } from "@/components/ui";

type RecordItem = {
  id: string;
  title: string;
  note: string | null;
  kind: string | null;
  date: string | null; // serialized ISO string or null
  vendor: string | null;
  cost: number | null;
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
};

type Props = {
  records: RecordItem[];
  homeId: string;
  initialCategory?: string;
  initialSearch?: string;
  initialSort?: string;
  categoryCounts: Record<string, number>;
};

export function RecordsPageClient({
  records,
  homeId,
  initialCategory,
  initialSearch,
  initialSort,
  categoryCounts,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch || "");
  const [category, setCategory] = useState(initialCategory || "all");
  const [sort, setSort] = useState(initialSort || "newest");

  function updateFilters(updates: {
    search?: string;
    category?: string;
    sort?: string;
  }) {
    const params = new URLSearchParams(searchParams?.toString());

    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search);
      } else {
        params.delete("search");
      }
    }

    if (updates.category !== undefined) {
      if (updates.category && updates.category !== "all") {
        params.set("category", updates.category);
      } else {
        params.delete("category");
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== "newest") {
        params.set("sort", updates.sort);
      } else {
        params.delete("sort");
      }
    }

    const queryString = params.toString();
    router.push(
      `/home/${homeId}/records${queryString ? `?${queryString}` : ""}`
    );
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    updateFilters({ search: value });
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    updateFilters({ category: value });
  }

  function handleSortChange(value: string) {
    setSort(value);
    updateFilters({ sort: value });
  }

  return (
    <>
      {/* Filters */}
      <section className={glass}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Search
            </label>
            <Input
              type="text"
              placeholder="Search by title, vendor, or notes..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Category
            </label>
            <Select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="all">All ({records.length})</option>
              <option value="maintenance">
                Maintenance ({categoryCounts.maintenance || 0})
              </option>
              <option value="repair">
                Repair ({categoryCounts.repair || 0})
              </option>
              <option value="upgrade">
                Upgrade ({categoryCounts.upgrade || 0})
              </option>
              <option value="inspection">
                Inspection ({categoryCounts.inspection || 0})
              </option>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Sort By
            </label>
            <Select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="cost-high">Highest Cost</option>
              <option value="cost-low">Lowest Cost</option>
              <option value="title">Title (A-Z)</option>
            </Select>
          </div>
        </div>
      </section>

      {/* Records List */}
      <section className={glass}>
        {records.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-white/70">
              {search || category !== "all"
                ? "No records match your filters"
                : "No maintenance records yet"}
            </p>
            {/* No button / link here – user will use the + Add Record button in the header */}
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <RecordCard key={record.id} record={record} homeId={homeId} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function RecordCard({
  record,
  homeId,
}: {
  record: RecordItem;
  homeId: string;
}) {
  return (
    <a
      href={`/home/${homeId}/records/${record.id}`}
      className="block rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="flex-1 text-lg font-medium text-white">
              {record.title}
            </h3>
            {record.kind && (
              <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-blue-400/20 text-blue-300">
                {record.kind}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
            {record.date && (
              <span className="flex items-center gap-1">
                <span className="text-base">📅</span>
                {new Date(record.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            {record.vendor && (
              <span className="flex items-center gap-1">
                <span className="text-base">🔧</span>
                {record.vendor}
              </span>
            )}
            {record.cost != null && record.cost > 0 && (
              <span className="flex items-center gap-1 font-medium text-green-300">
                <span className="text-base">💵</span>
                ${Number(record.cost).toLocaleString()}
              </span>
            )}
          </div>

          {record.note && (
            <p className="mt-2 line-clamp-2 text-sm text-white/80">
              {record.note}
            </p>
          )}

          {/* Attachments */}
          {record.attachments && record.attachments.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
              <span>📎</span>
              <span>
                {record.attachments.length} attachment
                {record.attachments.length > 1 ? "s" : ""}
              </span>
              {record.attachments.slice(0, 3).map((att) => (
                <button
                  key={att.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(
                      `/api/home/${homeId}/attachments/${att.id}`,
                      "_blank"
                    );
                  }}
                  className="underline hover:text-white/90"
                >
                  {att.filename.length > 15
                    ? att.filename.slice(0, 12) + "..."
                    : att.filename}
                </button>
              ))}
              {record.attachments.length > 3 && (
                <span>+{record.attachments.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center text-white/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </div>
      </div>
    </a>
  );
}