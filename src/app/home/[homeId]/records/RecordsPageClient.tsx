"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Select } from "@/components/ui";
import { textMeta } from "@/lib/glass";

/* match the darker request/submission surfaces */
const filterSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";
const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";
const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

type RecordItem = {
  id: string;
  title: string;
  note: string | null;
  kind: string | null;
  date: string | null;
  vendor: string | null;
  cost: number | null;
  attachments: Array<{
    id: string;
    filename: string;
    url: string | null;
    mimeType: string | null;
    size: number;
    uploadedBy: string;
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

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function shortName(name: string, max = 16) {
  if (!name) return "";
  return name.length > max ? name.slice(0, max - 3) + "..." : name;
}

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

  function updateFilters(updates: { search?: string; category?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams?.toString());

    if (updates.search !== undefined) {
      if (updates.search) params.set("search", updates.search);
      else params.delete("search");
    }

    if (updates.category !== undefined) {
      if (updates.category && updates.category !== "all") params.set("category", updates.category);
      else params.delete("category");
    }

    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== "newest") params.set("sort", updates.sort);
      else params.delete("sort");
    }

    const qs = params.toString();
    router.push(`/home/${homeId}/records${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <section className={filterSurface}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/55">Search</label>
            <Input
              type="text"
              placeholder="Search by title, vendor, or note"
              value={search}
              onChange={(e) => {
                const v = e.target.value;
                setSearch(v);
                updateFilters({ search: v });
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/55">Category</label>
            <Select
              value={category}
              onChange={(e) => {
                const v = e.target.value;
                setCategory(v);
                updateFilters({ category: v });
              }}
            >
              <option value="all">All ({records.length})</option>
              <option value="project">Project ({categoryCounts.project || 0})</option>
              <option value="maintenance">Maintenance ({categoryCounts.maintenance || 0})</option>
              <option value="repair">Repair ({categoryCounts.repair || 0})</option>
              <option value="upgrade">Upgrade ({categoryCounts.upgrade || 0})</option>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/55">Sort By</label>
            <Select
              value={sort}
              onChange={(e) => {
                const v = e.target.value;
                setSort(v);
                updateFilters({ sort: v });
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="cost-high">Highest Cost</option>
              <option value="cost-low">Lowest Cost</option>
              <option value="title">Title (A–Z)</option>
            </Select>
          </div>
        </div>
      </section>

      {/* List */}
      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <p className="mb-2 text-white/80">
            {search || category !== "all" ? "No records match your filters" : "No records yet"}
          </p>
          <p className={`text-sm ${textMeta}`}>Add your first record to start tracking home history.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} homeId={homeId} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecordCard({ record, homeId }: { record: RecordItem; homeId: string }) {
  return (
    <a href={`/home/${homeId}/records/${record.id}`} className={`${cardSurface} block`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {/* Title + kind pill */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-white sm:text-lg">{record.title}</h3>
            {record.kind ? (
              <span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                {record.kind}
              </span>
            ) : null}
          </div>

          {/* Meta row (match service cards vibe) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
            {record.date ? <span>📅 {formatDate(record.date)}</span> : null}
            {record.vendor ? <span>🔧 {record.vendor}</span> : null}
            {record.cost != null ? (
              <span className="font-medium text-green-200">💵 ${Number(record.cost).toLocaleString()}</span>
            ) : null}
          </div>

          {/* Note as inset surface like submissions description */}
          {record.note ? (
            <div className="mt-4">
              <div className={insetSurface}>
                <p className="text-sm text-white/80 whitespace-pre-wrap">{record.note}</p>
              </div>
            </div>
          ) : null}

          {/* Attachments preview row (compact) */}
          {record.attachments?.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/60">
              <span>📎</span>
              <span>
                {record.attachments.length} attachment{record.attachments.length > 1 ? "s" : ""}
              </span>

              {record.attachments.slice(0, 2).map((att) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(`/api/home/${homeId}/attachments/${att.id}`, "_blank");
                  }}
                  className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/75 hover:bg-black/25 hover:text-white"
                  title={att.filename}
                >
                  {shortName(att.filename)}
                </button>
              ))}

              {record.attachments.length > 2 ? <span>+{record.attachments.length - 2} more</span> : null}
            </div>
          ) : null}
        </div>

        {/* Right chevron */}
        <div className="flex items-center text-white/35 sm:pt-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </a>
  );
}