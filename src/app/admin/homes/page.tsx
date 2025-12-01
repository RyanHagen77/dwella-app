/**
 * ADMIN HOMES PAGE
 *
 * View and manage all homes in the system.
 * Search, filter, and view home details.
 *
 * Location: app/admin/homes/page.tsx
 */

import { prisma } from "@/lib/prisma";
import { glass, heading, textMeta } from "@/lib/glass";
import Link from "next/link";
import { Home, FileText, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import HomeFilters from "../_components/HomeFilters";
import HomeTable from "../_components/HomeTable";

type SearchParams = {
  page?: string;
  search?: string;
  sort?: string;
  order?: string;
};

export default async function HomesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 20;
  const search = params.search || "";
  const sortBy = params.sort || "createdAt";
  const sortOrder = params.order === "asc" ? "asc" : "desc";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { address: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { state: { contains: search, mode: "insensitive" } },
      { owner: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [homes, totalCount, stats] = await Promise.all([
    prisma.home.findMany({
      where,
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            records: true,
            warranties: true,
            connections: true,
            transfers: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.home.count({ where }),
    Promise.all([
      prisma.home.count(),
      prisma.record.count(),
      prisma.warranty.count(),
      prisma.reminder.count(),
    ]),
  ]);

  const [totalHomes, totalRecords, totalWarranties, totalReminders] = stats;
  const totalPages = Math.ceil(totalCount / limit);

  const serialized = homes.map((h) => ({
    id: h.id,
    address: h.address,
    city: h.city,
    state: h.state,
    zip: h.zip,
    createdAt: h.createdAt.toISOString(),
    owner: h.owner,
    recordCount: h._count.records,
    warrantyCount: h._count.warranties,
    connectionCount: h._count.connections,
    transferCount: h._count.transfers,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={"text-2xl font-bold " + heading}>Homes</h1>
          <p className={"mt-1 " + textMeta}>{totalCount.toLocaleString()} homes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Homes" value={totalHomes} icon={Home} />
        <StatCard label="Records" value={totalRecords} icon={FileText} />
        <StatCard label="Warranties" value={totalWarranties} icon={Shield} />
        <StatCard label="Reminders" value={totalReminders} icon={FileText} />
      </div>

      <HomeFilters search={search} sort={sortBy} order={sortOrder} />

      <section className={glass}>
        <HomeTable homes={serialized} />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <p className={"text-sm " + textMeta}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount}
            </p>
            <div className="flex gap-2">
              <PaginationLink page={page - 1} disabled={page <= 1} params={params}>
                <ChevronLeft size={16} />
                Previous
              </PaginationLink>
              <PaginationLink page={page + 1} disabled={page >= totalPages} params={params}>
                Next
                <ChevronRight size={16} />
              </PaginationLink>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className={"text-sm " + textMeta}>{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-white/10 p-2">
          <Icon size={20} className="text-white/70" />
        </div>
      </div>
    </div>
  );
}

function PaginationLink({
  page,
  disabled,
  params,
  children,
}: {
  page: number;
  disabled: boolean;
  params: SearchParams;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/30">
        {children}
      </span>
    );
  }

  const newParams = new URLSearchParams();
  newParams.set("page", page.toString());
  if (params.search) newParams.set("search", params.search);
  if (params.sort) newParams.set("sort", params.sort);
  if (params.order) newParams.set("order", params.order);

  return (
    <Link
      href={"/admin/homes?" + newParams.toString()}
      className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
    >
      {children}
    </Link>
  );
}