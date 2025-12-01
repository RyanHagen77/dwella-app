/**
 * ADMIN USERS MANAGEMENT PAGE
 *
 * Searchable, filterable table of all users.
 * Supports pagination, role filtering, and user actions.
 *
 * Location: app/admin/users/page.tsx
 */

import { prisma } from "@/lib/prisma";
import { glass, heading, textMeta, ctaGhost } from "@/lib/glass";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import UserFilters from "../_components/UserFilters";
import UserTable from "../_components/UserTable";

type SearchParams = {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  status?: string;
  sort?: string;
  order?: string;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = Math.min(50, Math.max(10, parseInt(params.limit || "20")));
  const search = params.search || "";
  const roleFilter = params.role || "all";
  const sortBy = params.sort || "createdAt";
  const sortOrder = params.order === "asc" ? "asc" : "desc";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (roleFilter !== "all") {
    where.role = roleFilter;
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        proStatus: true,
        createdAt: true,
        _count: {
          select: {
            homes: true,
            connectionsAsHomeowner: true,
            connectionsAsContractor: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    homeCount: u._count.homes,
    connectionCount: u._count.connectionsAsHomeowner + u._count.connectionsAsContractor,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${heading}`}>Users</h1>
          <p className={`mt-1 ${textMeta}`}>
            {totalCount.toLocaleString()} total users
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users/export" className={ctaGhost}>
            Export CSV
          </Link>
        </div>
      </div>

      <UserFilters
        search={search}
        role={roleFilter}
        status={params.status || "all"}
        sort={sortBy}
        order={sortOrder}
      />

      <section className={glass}>
        <UserTable users={serializedUsers} />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <p className={`text-sm ${textMeta}`}>
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, totalCount)} of {totalCount}
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
  if (params.limit) newParams.set("limit", params.limit);
  if (params.search) newParams.set("search", params.search);
  if (params.role && params.role !== "all") newParams.set("role", params.role);
  if (params.status && params.status !== "all") newParams.set("status", params.status);
  if (params.sort) newParams.set("sort", params.sort);
  if (params.order) newParams.set("order", params.order);

  return (
    <Link
      href={`/admin/users?${newParams.toString()}`}
      className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
    >
      {children}
    </Link>
  );
}