/**
 * ADMIN CONTRACTORS PAGE
 *
 * Manage professional applications.
 * Review pending, approved, and rejected contractors.
 *
 * Location: app/admin/contractors/page.tsx
 */

import { prisma } from "@/lib/prisma";
import { glass, heading, textMeta } from "@/lib/glass";
import Link from "next/link";
import { Briefcase, Clock, CheckCircle, XCircle } from "lucide-react";
import ContractorFilters from "../_components/ContractorFilters";
import ContractorCard from "../_components/ContractorCard";

type SearchParams = {
  status?: string;
  type?: string;
  search?: string;
};

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const statusFilter = params.status || "pending";
  const typeFilter = params.type || "all";
  const search = params.search || "";

  const where: Record<string, unknown> = { role: "PRO" };

  if (statusFilter === "pending") {
    where.proStatus = "PENDING";
  } else if (statusFilter === "approved") {
    where.proStatus = "APPROVED";
  } else if (statusFilter === "rejected") {
    where.proStatus = "REJECTED";
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { proProfile: { businessName: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (typeFilter !== "all") {
    where.proProfile = {
      ...(where.proProfile as object || {}),
      type: typeFilter.toUpperCase(),
    };
  }

  const [contractors, counts] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        proStatus: true,
        createdAt: true,
        proProfile: {
          select: {
            businessName: true,
            type: true,
            phone: true,
            licenseNo: true,
            website: true,
            bio: true,
            serviceAreas: true,
            specialties: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      prisma.user.count({ where: { role: "PRO", proStatus: "PENDING" } }),
      prisma.user.count({ where: { role: "PRO", proStatus: "APPROVED" } }),
      prisma.user.count({ where: { role: "PRO", proStatus: "REJECTED" } }),
    ]),
  ]);

  const [pendingCount, approvedCount, rejectedCount] = counts;

  const serialized = contractors.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    proStatus: c.proStatus,
    createdAt: c.createdAt.toISOString(),
    proProfile: c.proProfile,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${heading}`}>Contractors</h1>
          <p className={`mt-1 ${textMeta}`}>Review and manage professional applications</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusTab href="/admin/contractors?status=pending" label="Pending" count={pendingCount} active={statusFilter === "pending"} icon={Clock} color="amber" />
        <StatusTab href="/admin/contractors?status=approved" label="Approved" count={approvedCount} active={statusFilter === "approved"} icon={CheckCircle} color="emerald" />
        <StatusTab href="/admin/contractors?status=rejected" label="Rejected" count={rejectedCount} active={statusFilter === "rejected"} icon={XCircle} color="red" />
        <StatusTab href="/admin/contractors?status=all" label="All" count={pendingCount + approvedCount + rejectedCount} active={statusFilter === "all"} icon={Briefcase} color="white" />
      </div>

      <ContractorFilters search={search} type={typeFilter} status={statusFilter} />

      {serialized.length === 0 ? (
        <div className={`${glass} py-12 text-center`}>
          <Briefcase size={48} className="mx-auto mb-4 text-white/30" />
          <p className={textMeta}>
            {statusFilter === "pending" ? "No pending applications" : `No ${statusFilter} contractors found`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {serialized.map((contractor) => (
            <ContractorCard key={contractor.id} contractor={contractor} showActions={statusFilter === "pending"} />
          ))}
        </div>
      )}
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
  color: "amber" | "emerald" | "red" | "white";
}) {
  const colorClasses = {
    amber: active ? "border-amber-400/50 bg-amber-500/20 text-amber-200" : "border-white/10 text-white/60 hover:border-amber-400/30 hover:text-amber-300",
    emerald: active ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200" : "border-white/10 text-white/60 hover:border-emerald-400/30 hover:text-emerald-300",
    red: active ? "border-red-400/50 bg-red-500/20 text-red-200" : "border-white/10 text-white/60 hover:border-red-400/30 hover:text-red-300",
    white: active ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/60 hover:border-white/20 hover:text-white/80",
  };

  return (
    <Link href={href} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${colorClasses[color]}`}>
      <Icon size={16} />
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/20" : "bg-white/10"}`}>{count}</span>
    </Link>
  );
}