/**
 * ADMIN HOME DETAIL PAGE
 *
 * View and manage individual home details.
 *
 * Location: app/admin/homes/[id]/page.tsx
 */

import { prisma } from "@/lib/prisma";
import { glass, heading, textMeta } from "@/lib/glass";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, FileText, Shield, Link2, ArrowLeftRight, Calendar } from "lucide-react";

export default async function HomeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const home = await prisma.home.findUnique({
    where: { id },
    include: {
      owner: true,
      _count: {
        select: {
          records: true,
          warranties: true,
          connections: true,
          transfers: true,
        },
      },
    },
  });

  if (!home) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/homes"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className={"text-2xl font-bold " + heading}>{home.address}</h1>
          <p className={textMeta}>{home.city}, {home.state} {home.zip}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className={glass}>
            <h2 className={"mb-4 text-lg font-semibold " + heading}>Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <MapPin size={12} className="text-white/50" />
                  <span className={"text-xs " + textMeta}>Address</span>
                </div>
                <p className="text-white">{home.address}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <MapPin size={12} className="text-white/50" />
                  <span className={"text-xs " + textMeta}>City</span>
                </div>
                <p className="text-white">{home.city}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <MapPin size={12} className="text-white/50" />
                  <span className={"text-xs " + textMeta}>State</span>
                </div>
                <p className="text-white">{home.state}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <MapPin size={12} className="text-white/50" />
                  <span className={"text-xs " + textMeta}>ZIP</span>
                </div>
                <p className="text-white">{home.zip}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <Calendar size={12} className="text-white/50" />
                  <span className={"text-xs " + textMeta}>Added</span>
                </div>
                <p className="text-white">{new Date(home.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </section>

          {home.owner && (
            <section className={glass}>
              <h2 className={"mb-4 text-lg font-semibold " + heading}>Owner</h2>
              <Link
                href={"/admin/users/" + home.owner.id}
                className="flex items-center gap-3 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-bold text-emerald-400">
                  {(home.owner.name || home.owner.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white">{home.owner.name || "No name"}</p>
                  <p className={textMeta}>{home.owner.email}</p>
                </div>
              </Link>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className={glass}>
            <h2 className={"mb-4 text-lg font-semibold " + heading}>Stats</h2>
            <div className="space-y-3">
              <StatItem icon={FileText} label="Records" value={home._count.records} />
              <StatItem icon={Shield} label="Warranties" value={home._count.warranties} />
              <StatItem icon={Link2} label="Connections" value={home._count.connections} />
              <StatItem icon={ArrowLeftRight} label="Transfers" value={home._count.transfers} />
            </div>
          </section>

          <section className={glass}>
            <h2 className={"mb-4 text-lg font-semibold " + heading}>Quick Links</h2>
            <div className="space-y-2">
              <QuickLink href={"/admin/connections?homeId=" + home.id} label="View Connections" />
              <QuickLink href={"/admin/transfers?homeId=" + home.id} label="View Transfers" />
            </div>
          </section>
        </div>
      </div>
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-white/50" />
        <span className={textMeta}>{label}</span>
      </div>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      {label} →
    </Link>
  );
}