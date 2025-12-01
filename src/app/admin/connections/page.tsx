/**
 * ADMIN CONNECTIONS PAGE
 *
 * View and manage connections between homeowners and contractors.
 *
 * Location: app/admin/connections/page.tsx
 */

import { prisma } from "@/lib/prisma";
import { glass, heading, textMeta } from "@/lib/glass";
import Link from "next/link";
import { Link2, Clock, CheckCircle, Archive, ChevronLeft, ChevronRight } from "lucide-react";
import ConnectionFilters from "../_components/ConnectionFilters";
import ConnectionTable from "../_components/ConnectionTable";

type SearchParams = {
  page?: string;
  status?: string;
  search?: string;
  homeId?: string;
};

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 20;
  const statusFilter = params.status || "all";
  const search = params.search || "";
  const homeId = params.homeId || "";

  const where: Record<string, unknown> = {};

  if (statusFilter !== "all") {
    where.status = statusFilter.toUpperCase();
  }

  if (homeId) {
    where.homeId = homeId;
  }

  if (search) {
    where.OR = [
      { homeowner: { name: { contains: search, mode: "insensitive" } } },
      { homeowner: { email: { contains: search, mode: "insensitive" } } },
      { contractor: { name: { contains: search, mode: "insensitive" } } },
      { contractor: { email: { contains: search, mode: "insensitive" } } },
      { home: { address: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [connections, totalCount, counts] = await Promise.all([
    prisma.connection.findMany({
      where,
      select: {
        id: true,
        status: true,
        createdAt: true,
        home: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
          },
        },
        homeowner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
            email: true,
            proProfile: {
              select: {
                businessName: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.connection.count({ where }),
    Promise.all([
      prisma.connection.count({ where: { status: "PENDING" } }),
      prisma.connection.count({ where: { status: "ACTIVE" } }),
      prisma.connection.count({ where: { archivedAt: { not: null } } }),
    ]),
  ]);

  const [pendingCount, activeCount, archivedCount] = counts;
  const totalPages = Math.ceil(totalCount / limit);

  const serialized = connections.map((c) => ({
    id: c.id,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    home: c.home,
    homeowner: c.homeowner,
    contractor: c.contractor ? {
      id: c.contractor.id,
      name: c.contractor.name,
      email: c.contractor.email,
      businessName: c.contractor.proProfile?.businessName || null,
    } : null,
    messageCount: c._count.messages,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={"text-2xl font-bold " + heading}>Connections</h1>
          <p className={"mt-1 " + textMeta}>
            {homeId ? "Connections for selected home" : totalCount.toLocaleString() + " total connections"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusTab href="/admin/connections" label="All" count={pendingCount + activeCount + archivedCount} active={statusFilter === "all"} icon={Link2} color="white" />
        <StatusTab href="/admin/connections?status=pending" label="Pending" count={pendingCount} active={statusFilter === "pending"} icon={Clock} color="amber" />
        <StatusTab href="/admin/connections?status=active" label="Active" count={activeCount} active={statusFilter === "active"} icon={CheckCircle} color="emerald" />
        <StatusTab href="/admin/connections?status=archived" label="Archived" count={archivedCount} active={statusFilter === "archived"} icon={Archive} color="gray" />
      </div>

      <ConnectionFilters search={search} status={statusFilter} homeId={homeId} />

      <section className={glass}>
        <ConnectionTable connections={serialized} />

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

function StatusTab({
  href,
  label,
  count,
  active,
  icon: Icon,
  color,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  icon: React.ElementType;
  color: "amber" | "emerald" | "gray" | "white";
}) {
  const colorClasses: Record<string, string> = {
    amber: active ? "border-amber-400/50 bg-amber-500/20 text-amber-200" : "border-white/10 text-white/60 hover:border-amber-400/30 hover:text-amber-300",
    emerald: active ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200" : "border-white/10 text-white/60 hover:border-emerald-400/30 hover:text-emerald-300",
    gray: active ? "border-gray-400/50 bg-gray-500/20 text-gray-200" : "border-white/10 text-white/60 hover:border-gray-400/30 hover:text-gray-300",
    white: active ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/60 hover:border-white/20 hover:text-white/80",
  };

  return (
    <Link href={href} className={"flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all " + colorClasses[color]}>
      <Icon size={16} />
      {label}
      <span className={"rounded-full px-2 py-0.5 text-xs " + (active ? "bg-white/20" : "bg-white/10")}>{count}</span>
    </Link>
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
  if (params.status && params.status !== "all") newParams.set("status", params.status);
  if (params.search) newParams.set("search", params.search);
  if (params.homeId) newParams.set("homeId", params.homeId);

  return (
    <Link
      href={"/admin/connections?" + newParams.toString()}
      className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
    >
      {children}
    </Link>
  );
}