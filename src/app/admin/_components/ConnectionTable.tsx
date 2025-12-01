/**
 * ADMIN CONNECTION TABLE
 *
 * Displays connections with homeowner, contractor, and actions.
 *
 * Location: app/admin/connections/_components/ConnectionTable.tsx
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { textMeta } from "@/lib/glass";
import { MoreHorizontal, MapPin, User, Briefcase, MessageSquare, Clock, CheckCircle, Archive } from "lucide-react";

type Connection = {
  id: string;
  status: string;
  createdAt: string;
  home: {
    id: string;
    address: string;
    city: string;
    state: string;
  };
  homeowner: {
    id: string;
    name: string | null;
    email: string;
  };
  contractor: {
    id: string;
    name: string | null;
    email: string;
    businessName: string | null;
  } | null;
  messageCount: number;
};

export default function ConnectionTable({ connections }: { connections: Connection[] }) {
  if (connections.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className={textMeta}>No connections found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-white/70">
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Property</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Homeowner</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Contractor</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Status</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Messages</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Created</th>
            <th className="border-b border-white/10 pb-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((connection) => (
            <ConnectionRow key={connection.id} connection={connection} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConnectionRow({ connection }: { connection: Connection }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isPending, startTransition] = useTransition();

  const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
    PENDING: { icon: Clock, color: "text-amber-400" },
    ACTIVE: { icon: CheckCircle, color: "text-emerald-400" },
    ARCHIVED: { icon: Archive, color: "text-gray-400" },
  };

  const config = statusConfig[connection.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  async function handleArchive() {
    if (!confirm("Archive this connection?")) return;

    const res = await fetch("/api/admin/connections/" + connection.id + "/archive", {
      method: "POST",
    });

    if (res.ok) {
      startTransition(() => router.refresh());
    } else {
      alert("Failed to archive connection");
    }
    setShowMenu(false);
  }

  return (
    <tr className="group border-b border-white/5 hover:bg-white/5">
      <td className="py-3 pr-4">
        <Link href={"/admin/homes/" + connection.home.id} className="flex items-center gap-3 group/link">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <MapPin size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-white group-hover/link:text-emerald-400">{connection.home.address}</p>
            <p className={"text-xs " + textMeta}>{connection.home.city}, {connection.home.state}</p>
          </div>
        </Link>
      </td>

      <td className="py-3 pr-4">
        <Link href={"/admin/users/" + connection.homeowner.id} className="flex items-center gap-2 group/link">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
            <User size={14} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-white group-hover/link:text-emerald-400">
              {connection.homeowner.name || "No name"}
            </p>
            <p className={"text-xs " + textMeta}>{connection.homeowner.email}</p>
          </div>
        </Link>
      </td>

      <td className="py-3 pr-4">
        {connection.contractor ? (
          <Link href={"/admin/users/" + connection.contractor.id} className="flex items-center gap-2 group/link">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
              <Briefcase size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white group-hover/link:text-blue-400">
                {connection.contractor.businessName || connection.contractor.name || "No name"}
              </p>
              <p className={"text-xs " + textMeta}>{connection.contractor.email}</p>
            </div>
          </Link>
        ) : (
          <span className={textMeta}>No contractor</span>
        )}
      </td>

      <td className="py-3 pr-4">
        <div className={"flex items-center gap-1.5 " + config.color}>
          <StatusIcon size={14} />
          <span className="text-sm">{connection.status}</span>
        </div>
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={14} className="text-white/50" />
          <span className="text-white/90">{connection.messageCount}</span>
        </div>
      </td>

      <td className="py-3 pr-4">
        <span className={textMeta}>{new Date(connection.createdAt).toLocaleDateString()}</span>
      </td>

      <td className="py-3 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={isPending}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-white/20 bg-gray-900/95 py-1 shadow-xl backdrop-blur-xl">
                <MenuLink href={"/admin/connections/" + connection.id + "/messages"} label="View Messages" onClick={() => setShowMenu(false)} />
                <MenuLink href={"/admin/homes/" + connection.home.id} label="View Home" onClick={() => setShowMenu(false)} />
                {connection.status !== "ARCHIVED" && (
                  <>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      onClick={handleArchive}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-400 transition-colors hover:bg-amber-500/10"
                    >
                      Archive Connection
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function MenuLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
  );
}