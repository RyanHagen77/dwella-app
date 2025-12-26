"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  formFieldShell,
  formInputInner,
  formSelectInner,
  formLabelCaps,
} from "@/components/ui/formFields";

import { textMeta } from "@/lib/glass";

/* =========================
   Shared “standard” surfaces
   (match Warranties list cards)
   ========================= */

const filterSurface =
  "rounded-2xl bg-black/25 p-5 backdrop-blur";
  
const cardRow =
  "group relative overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur " +
  "transition hover:bg-black/30 hover:border-white/15";

const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

/* =========================
   Types
   ========================= */

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

/* =========================
   Utils
   ========================= */

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function shortName(name: string, max = 18) {
  if (!name) return "";
  return name.length > max ? name.slice(0, max - 3) + "..." : name;
}

/** Accent bar (same geometry as warranties: before:top-3/bottom-3/w-[3px]) */
function leftAccentForKind(kind?: string | null) {
  const k = (kind || "").toLowerCase();

  if (k === "maintenance") return "before:bg-sky-400/70";
  if (k === "repair") return "before:bg-orange-400/70";
  if (k === "upgrade") return "before:bg-purple-400/70";
  if (k === "project") return "before:bg-indigo-400/70";
  return "before:bg-white/12";
}

function kindPillClass(kind?: string | null) {
  const k = (kind || "").toLowerCase();

  if (k === "maintenance") return "border-sky-400/25 bg-sky-400/10 text-sky-100";
  if (k === "repair") return "border-orange-400/25 bg-orange-400/10 text-orange-100";
  if (k === "upgrade") return "border-purple-400/25 bg-purple-400/10 text-purple-100";
  if (k === "project") return "border-indigo-400/25 bg-indigo-400/10 text-indigo-100";
  return "border-white/12 bg-white/5 text-white/70";
}

function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0 text-white/35"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

/* =========================
   Page
   ========================= */

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

  const safeRecords = Array.isArray(records) ? records : [];

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
            <label className={formLabelCaps}>Search</label>
            <div className={formFieldShell}>
              <input
                className={formInputInner}
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
          </div>

          <div>
            <label className={formLabelCaps}>Category</label>
            <div className={`${formFieldShell} relative`}>
              <select
                className={formSelectInner}
                value={category}
                onChange={(e) => {
                  const v = e.target.value;
                  setCategory(v);
                  updateFilters({ category: v });
                }}
              >
                <option value="all">All ({safeRecords.length})</option>
                <option value="project">Project ({categoryCounts.project || 0})</option>
                <option value="maintenance">Maintenance ({categoryCounts.maintenance || 0})</option>
                <option value="repair">Repair ({categoryCounts.repair || 0})</option>
                <option value="upgrade">Upgrade ({categoryCounts.upgrade || 0})</option>
              </select>
              <Chevron />
            </div>
          </div>

          <div>
            <label className={formLabelCaps}>Sort By</label>
            <div className={`${formFieldShell} relative`}>
              <select
                className={formSelectInner}
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
              </select>
              <Chevron />
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      {safeRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <p className="mb-2 text-white/80">
            {search || category !== "all" ? "No records match your filters" : "No records yet"}
          </p>
          <p className={`text-sm ${textMeta}`}>Add your first record to start tracking home history.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {safeRecords.map((record) => (
            <li key={record.id} className="list-none">
              <RecordCard record={record} homeId={homeId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* =========================
   Record card (Warranties parity)
   ========================= */

function RecordCard({ record, homeId }: { record: RecordItem; homeId: string }) {
  const attachments = Array.isArray(record.attachments) ? record.attachments : [];

  const meta: string[] = [];
  if (record.date) meta.push(`📅 ${formatDate(record.date)}`);
  if (record.vendor) meta.push(`🔧 ${record.vendor}`);

  return (
    <Link
      href={`/home/${homeId}/records/${record.id}`}
      className={[
        cardRow,
        "block",
        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
        leftAccentForKind(record.kind),
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        {/* icon square (same vibe as warranties/service list) */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg">
          🧾
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-white">{record.title}</h3>

                {record.kind ? (
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                      kindPillClass(record.kind),
                    ].join(" ")}
                  >
                    {record.kind}
                  </span>
                ) : null}

                {record.cost != null ? (
                  <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-100">
                    💵 ${Number(record.cost).toLocaleString()}
                  </span>
                ) : null}
              </div>

              {meta.length ? <p className="mt-1 truncate text-xs text-white/60">{meta.join(" • ")}</p> : null}

              {record.note ? <p className="mt-2 line-clamp-1 text-xs text-white/65">{record.note}</p> : null}

              {/* attachments chips (small + subtle) */}
              {attachments.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                    📎 {attachments.length} attachment{attachments.length === 1 ? "" : "s"}
                  </span>

                  {attachments.slice(0, 2).map((att) => (
                    <span
                      key={att.id}
                      className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/70"
                      title={att.filename}
                    >
                      {shortName(att.filename)}
                    </span>
                  ))}

                  {attachments.length > 2 ? <span className="text-white/45">+{attachments.length - 2} more</span> : null}
                </div>
              ) : null}
            </div>

            {/* right meta + chevron */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right text-xs text-white/55">
                <div>Date</div>
                <div>{record.date ? formatDate(record.date) : "—"}</div>
              </div>
              <ChevronRight />
            </div>
          </div>

          {/* bottom meta row (matches list-card language) */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
            {record.date ? <span>Date {formatDate(record.date)}</span> : null}
            {record.vendor ? <span>Vendor {record.vendor}</span> : null}
            {record.cost != null ? <span>Cost ${Number(record.cost).toLocaleString()}</span> : null}
          </div>

          {/* optional inset for longer note (only if you want the extra slab) */}
          {record.note && record.note.length > 140 ? (
            <div className="mt-4">
              <div className={insetSurface}>
                <p className="whitespace-pre-wrap text-sm text-white/85">{record.note}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}