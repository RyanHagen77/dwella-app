/**
 * ADMIN JOB REQUESTS PAGE
 *
 * View all job requests between homeowners and contractors.
 *
 * Location: app/admin/service-requests/page.tsx
 */

import { prisma } from "@/lib/prisma";
import { glass, heading, textMeta } from "@/lib/glass";
import Link from "next/link";
import { ClipboardList, Clock, CheckCircle, XCircle, Ban, MapPin, User, Briefcase } from "lucide-react";

type SearchParams = {
  status?: string;
};

export default async function ServiceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || "all";

  const where: Record<string, unknown> = {};

  if (statusFilter !== "all") {
    where.status = statusFilter.toUpperCase();
  }

  const [serviceRequests, counts] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      select: {
        id: true,
        title: true,
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
      },
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      prisma.serviceRequest.count({ where: { status: "PENDING" } }),
      prisma.serviceRequest.count({ where: { status: "ACCEPTED" } }),
      prisma.serviceRequest.count({ where: { status: "COMPLETED" } }),
      prisma.serviceRequest.count({ where: { status: "DECLINED" } }),
      prisma.serviceRequest.count({ where: { status: "CANCELLED" } }),
    ]),
  ]);

  const [pendingCount, acceptedCount, completedCount, declinedCount, cancelledCount] = counts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={"text-2xl font-bold " + heading}>Job Requests</h1>
          <p className={"mt-1 " + textMeta}>{serviceRequests.length} requests</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusTab href="/admin/service-requests" label="All" count={pendingCount + acceptedCount + completedCount + declinedCount + cancelledCount} active={statusFilter === "all"} icon={ClipboardList} color="white" />
        <StatusTab href="/admin/service-requests?status=pending" label="Pending" count={pendingCount} active={statusFilter === "pending"} icon={Clock} color="amber" />
        <StatusTab href="/admin/service-requests?status=accepted" label="Accepted" count={acceptedCount} active={statusFilter === "accepted"} icon={CheckCircle} color="emerald" />
        <StatusTab href="/admin/service-requests?status=completed" label="Completed" count={completedCount} active={statusFilter === "completed"} icon={CheckCircle} color="blue" />
        <StatusTab href="/admin/service-requests?status=declined" label="Declined" count={declinedCount} active={statusFilter === "declined"} icon={XCircle} color="red" />
        <StatusTab href="/admin/service-requests?status=cancelled" label="Cancelled" count={cancelledCount} active={statusFilter === "cancelled"} icon={Ban} color="gray" />
      </div>

      {serviceRequests.length === 0 ? (
        <div className={glass + " py-12 text-center"}>
          <ClipboardList size={48} className="mx-auto mb-4 text-white/30" />
          <p className={textMeta}>No job requests found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {serviceRequests.map((service) => (
            <ServiceRequestCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceRequestCard({
  service,
}: {
  service: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    home: { id: string; address: string; city: string; state: string };
    homeowner: { id: string; name: string | null; email: string };
    contractor: { id: string; name: string | null; email: string; proProfile: { businessName: string | null } | null } | null;
  };
}) {
  const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    PENDING: { icon: Clock, color: "text-amber-400", bg: "border-amber-400/30 bg-amber-500/10" },
    ACCEPTED: { icon: CheckCircle, color: "text-emerald-400", bg: "border-emerald-400/30 bg-emerald-500/10" },
    COMPLETED: { icon: CheckCircle, color: "text-blue-400", bg: "border-blue-400/30 bg-blue-500/10" },
    DECLINED: { icon: XCircle, color: "text-red-400", bg: "border-red-400/30 bg-red-500/10" },
    CANCELLED: { icon: Ban, color: "text-gray-400", bg: "border-gray-400/30 bg-gray-500/10" },
  };

  const config = statusConfig[service.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <div className={glass + " flex flex-col"}>
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-white">{service.title}</h3>
        <span className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium " + config.bg + " " + config.color}>
          <StatusIcon size={12} />
          {service.status}
        </span>
      </div>

      <div className="space-y-2">
        <Link href={"/admin/homes/" + service.home.id} className="flex items-center gap-2 group">
          <MapPin size={14} className="text-white/50" />
          <span className="text-sm text-white/80 group-hover:text-emerald-400">{service.home.address}, {service.home.city}</span>
        </Link>

        <Link href={"/admin/users/" + service.homeowner.id} className="flex items-center gap-2 group">
          <User size={14} className="text-white/50" />
          <span className="text-sm text-white/80 group-hover:text-emerald-400">{service.homeowner.name || service.homeowner.email}</span>
        </Link>

        {service.contractor && (
          <Link href={"/admin/users/" + service.contractor.id} className="flex items-center gap-2 group">
            <Briefcase size={14} className="text-white/50" />
            <span className="text-sm text-white/80 group-hover:text-blue-400">
              {service.contractor.proProfile?.businessName || service.contractor.name || service.contractor.email}
            </span>
          </Link>
        )}
      </div>

      <div className={"mt-auto pt-3 border-t border-white/10 text-xs " + textMeta}>
        Created {new Date(service.createdAt).toLocaleDateString()}
      </div>
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
  color: "amber" | "emerald" | "blue" | "red" | "gray" | "white";
}) {
  const colorClasses: Record<string, string> = {
    amber: active ? "border-amber-400/50 bg-amber-500/20 text-amber-200" : "border-white/10 text-white/60 hover:border-amber-400/30 hover:text-amber-300",
    emerald: active ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200" : "border-white/10 text-white/60 hover:border-emerald-400/30 hover:text-emerald-300",
    blue: active ? "border-blue-400/50 bg-blue-500/20 text-blue-200" : "border-white/10 text-white/60 hover:border-blue-400/30 hover:text-blue-300",
    red: active ? "border-red-400/50 bg-red-500/20 text-red-200" : "border-white/10 text-white/60 hover:border-red-400/30 hover:text-red-300",
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