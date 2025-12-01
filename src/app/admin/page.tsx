/**
 * ADMIN DASHBOARD OVERVIEW
 *
 * Main admin landing page with key metrics,
 * alerts for pending items, and recent activity feed.
 *
 * Location: app/admin/page.tsx
 */

import { prisma } from "@/lib/prisma";
import { glass, glassTight, heading, textMeta, ctaGhost } from "@/lib/glass";
import {
  Users,
  Home,
  ArrowLeftRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

async function getStats() {
  const [
    totalUsers,
    totalHomes,
    totalTransfers,
    pendingTransfers,
    pendingPros,
    activeConnections,
    recentUsers,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.home.count(),
    prisma.homeTransfer.count(),
    prisma.homeTransfer.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "PRO", proStatus: "PENDING" } }),
    prisma.connection.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    getRecentActivity(),
  ]);

  return {
    totalUsers,
    totalHomes,
    totalTransfers,
    pendingTransfers,
    pendingPros,
    activeConnections,
    recentUsers,
    recentActivity,
  };
}

async function getRecentActivity() {
  const [newUsers, newTransfers, newConnections] = await Promise.all([
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.homeTransfer.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        home: { select: { address: true } },
        fromUser: { select: { name: true } },
      },
    }),
    prisma.connection.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        homeowner: { select: { name: true } },
        contractor: { select: { name: true } },
      },
    }),
  ]);

  type ActivityItem = {
    id: string;
    type: "user" | "transfer" | "connection";
    description: string;
    timestamp: Date;
    status?: string;
  };

  const activities: ActivityItem[] = [
    ...newUsers.map((u) => ({
      id: `user-${u.id}`,
      type: "user" as const,
      description: `${u.name || u.email} joined as ${u.role.toLowerCase()}`,
      timestamp: u.createdAt,
    })),
    ...newTransfers.map((t) => ({
      id: `transfer-${t.id}`,
      type: "transfer" as const,
      description: `Transfer initiated for ${t.home.address}`,
      timestamp: t.createdAt,
      status: t.status,
    })),
    ...newConnections.map((c) => ({
      id: `connection-${c.id}`,
      type: "connection" as const,
      description: `${c.homeowner?.name || "Homeowner"} connected with ${c.contractor?.name || "Contractor"}`,      timestamp: c.createdAt,
      status: c.status,
    })),
  ];

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${heading}`}>Dashboard</h1>
          <p className={`mt-1 ${textMeta}`}>
            Welcome back. Here&apos;s what&apos;s happening with Dwella.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          change={`+${stats.recentUsers} this week`}
          icon={Users}
          href="/admin/users"
        />
        <StatCard
          label="Homes"
          value={stats.totalHomes}
          icon={Home}
          href="/admin/homes"
        />
        <StatCard
          label="Active Connections"
          value={stats.activeConnections}
          icon={TrendingUp}
          href="/admin/connections"
        />
        <StatCard
          label="Total Transfers"
          value={stats.totalTransfers}
          icon={ArrowLeftRight}
          href="/admin/transfers"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stats.pendingPros > 0 && (
          <AlertCard
            title="Pending Pro Applications"
            count={stats.pendingPros}
            description="Contractors waiting for review"
            href="/admin/contractors?status=pending"
            variant="warning"
          />
        )}
        {stats.pendingTransfers > 0 && (
          <AlertCard
            title="Pending Transfers"
            count={stats.pendingTransfers}
            description="Home transfers awaiting action"
            href="/admin/transfers?status=pending"
            variant="info"
          />
        )}
      </div>

      <section className={glass}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${heading}`}>Recent Activity</h2>
          <span className={`text-sm ${textMeta}`}>Last 10 events</span>
        </div>

        <div className="space-y-3">
          {stats.recentActivity.length === 0 ? (
            <p className={textMeta}>No recent activity</p>
          ) : (
            stats.recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          )}
        </div>
      </section>

      <section className={glass}>
        <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink href="/admin/users?role=HOMEOWNER" label="View Homeowners" icon={Users} />
          <QuickLink href="/admin/contractors" label="Manage Contractors" icon={TrendingUp} />
          <QuickLink href="/admin/transfers?status=PENDING" label="Review Transfers" icon={ArrowLeftRight} />
          <QuickLink href="/admin/system" label="System Health" icon={AlertCircle} />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  change?: string;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link href={href} className={`${glassTight} group transition-all hover:bg-white/15`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${textMeta}`}>{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value.toLocaleString()}</p>
          {change && <p className="mt-1 text-xs text-emerald-400">{change}</p>}
        </div>
        <div className="rounded-lg bg-white/10 p-2 transition-colors group-hover:bg-white/20">
          <Icon size={20} className="text-white/70" />
        </div>
      </div>
    </Link>
  );
}

function AlertCard({
  title,
  count,
  description,
  href,
  variant,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  variant: "warning" | "info" | "danger";
}) {
  const colors = {
    warning: "border-amber-500/30 bg-amber-500/10",
    info: "border-blue-500/30 bg-blue-500/10",
    danger: "border-red-500/30 bg-red-500/10",
  };

  const textColors = {
    warning: "text-amber-400",
    info: "text-blue-400",
    danger: "text-red-400",
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:bg-white/5 ${colors[variant]}`}
    >
      <div className={`text-3xl font-bold ${textColors[variant]}`}>{count}</div>
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className={`text-sm ${textMeta}`}>{description}</p>
      </div>
      <Clock size={20} className={`ml-auto ${textColors[variant]}`} />
    </Link>
  );
}

function ActivityItem({
  activity,
}: {
  activity: {
    id: string;
    type: "user" | "transfer" | "connection";
    description: string;
    timestamp: Date;
    status?: string;
  };
}) {
  const icons = {
    user: Users,
    transfer: ArrowLeftRight,
    connection: TrendingUp,
  };

  const Icon = icons[activity.type];

const StatusIconComponent = activity.status
  ? activity.status === "ACCEPTED" || activity.status === "ACTIVE"
    ? CheckCircle2
    : activity.status === "DECLINED" || activity.status === "REJECTED"
      ? XCircle
      : Clock
  : null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
      <div className="rounded-full bg-white/10 p-2">
        <Icon size={14} className="text-white/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm text-white">{activity.description}</p>
        <p className={`text-xs ${textMeta}`}>{formatRelativeTime(activity.timestamp)}</p>
      </div>
      {StatusIconComponent && (
        <StatusIconComponent
          size={16}
          className={
            activity.status === "ACCEPTED" || activity.status === "ACTIVE"
              ? "text-emerald-400"
              : activity.status === "DECLINED" || activity.status === "REJECTED"
                ? "text-red-400"
                : "text-amber-400"
          }
        />
      )}
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href} className={`${ctaGhost} flex items-center gap-2 justify-center`}>
      <Icon size={16} />
      {label}
    </Link>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}