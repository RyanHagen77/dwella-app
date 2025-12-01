/**
 * ADMIN SYSTEM PAGE
 *
 * System health, database stats, and maintenance tasks.
 *
 * Location: app/admin/system/page.tsx
 */

import { prisma } from "@/lib/prisma";
import { glass, heading, textMeta } from "@/lib/glass";
import { Activity, Database, Users, Home, ArrowLeftRight, Link2, MessageSquare, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import SystemActions from "../_components/SystemActions";

export default async function SystemPage() {
  const now = new Date();

  const [
    userCount,
    homeCount,
    transferCount,
    connectionCount,
    messageCount,
    pendingTransfers,
    expiredTransfers,
    oldPendingTransfers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.home.count(),
    prisma.homeTransfer.count(),
    prisma.connection.count(),
    prisma.message.count(),
    prisma.homeTransfer.count({ where: { status: "PENDING" } }),
    prisma.homeTransfer.count({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
    }),
    prisma.homeTransfer.count({
      where: {
        status: "PENDING",
        createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const dbHealthy = true;
  const expiredHealthy = expiredTransfers === 0;
  const oldPendingHealthy = oldPendingTransfers < 5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={"text-2xl font-bold " + heading}>System</h1>
        <p className={"mt-1 " + textMeta}>Health checks, stats, and maintenance</p>
      </div>

      <section className={glass}>
        <h2 className={"text-lg font-semibold mb-4 " + heading}>Health Checks</h2>
        <div className="space-y-3">
          <HealthCheck
            label="Database Connection"
            status={dbHealthy ? "healthy" : "error"}
            message={dbHealthy ? "Connected" : "Connection failed"}
          />
          <HealthCheck
            label="Expired Transfers"
            status={expiredHealthy ? "healthy" : "warning"}
            message={expiredHealthy ? "None pending" : expiredTransfers + " need attention"}
          />
          <HealthCheck
            label="Old Pending Transfers"
            status={oldPendingHealthy ? "healthy" : "warning"}
            message={oldPendingHealthy ? "All recent" : oldPendingTransfers + " older than 7 days"}
          />
        </div>
      </section>

      <section className={glass}>
        <h2 className={"text-lg font-semibold mb-4 " + heading}>Database Stats</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatItem icon={Users} label="Users" value={userCount} />
          <StatItem icon={Home} label="Homes" value={homeCount} />
          <StatItem icon={ArrowLeftRight} label="Transfers" value={transferCount} />
          <StatItem icon={Link2} label="Connections" value={connectionCount} />
          <StatItem icon={MessageSquare} label="Messages" value={messageCount} />
        </div>
      </section>

      <section className={glass}>
        <h2 className={"text-lg font-semibold mb-4 " + heading}>Maintenance Tasks</h2>
        <SystemActions
          expiredCount={expiredTransfers}
          oldPendingCount={oldPendingTransfers}
        />
      </section>

      <section className={glass}>
        <h2 className={"text-lg font-semibold mb-4 " + heading}>System Info</h2>
        <div className="space-y-2 text-sm">
          <InfoRow label="Environment" value={process.env.NODE_ENV || "development"} />
          <InfoRow label="Server Time" value={now.toISOString()} />
          <InfoRow label="Pending Transfers" value={String(pendingTransfers)} />
          <InfoRow label="Expired (need cleanup)" value={String(expiredTransfers)} />
        </div>
      </section>
    </div>
  );
}

function HealthCheck({
  label,
  status,
  message,
}: {
  label: string;
  status: "healthy" | "warning" | "error";
  message: string;
}) {
  const config = {
    healthy: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className={"flex items-center justify-between rounded-lg p-3 " + c.bg}>
      <div className="flex items-center gap-3">
        <Icon size={18} className={c.color} />
        <span className="font-medium text-white">{label}</span>
      </div>
      <span className={"text-sm " + c.color}>{message}</span>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-white/5 p-3 text-center">
      <Icon size={20} className="mx-auto mb-2 text-white/50" />
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className={"text-xs " + textMeta}>{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-2">
      <span className={textMeta}>{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}