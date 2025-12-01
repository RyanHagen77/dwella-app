/**
 * ADMIN HOME TABLE
 *
 * Displays list of homes with owner info and counts.
 *
 * Location: app/admin/homes/_components/HomeTable.tsx
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { textMeta } from "@/lib/glass";
import { MoreHorizontal, Eye, ArrowLeftRight, Link2, MapPin, FileText, Shield } from "lucide-react";

type Home = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  recordCount: number;
  warrantyCount: number;
  connectionCount: number;
  transferCount: number;
};

type Props = {
  homes: Home[];
};

export default function HomeTable({ homes }: Props) {
  if (homes.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className={textMeta}>No homes found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-white/70">
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Property</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Owner</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Records</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Warranties</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Connections</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Added</th>
            <th className="border-b border-white/10 pb-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {homes.map((home) => (
            <HomeRow key={home.id} home={home} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HomeRow({ home }: { home: Home }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <tr className="group border-b border-white/5 hover:bg-white/5">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <MapPin size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-white">{home.address}</p>
            <p className={"text-xs " + textMeta}>{home.city}, {home.state} {home.zip}</p>
          </div>
        </div>
      </td>

      <td className="py-3 pr-4">
        {home.owner ? (
          <Link href={"/admin/users/" + home.owner.id} className="group/link">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
                {(home.owner.name || home.owner.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-white group-hover/link:text-emerald-400">{home.owner.name || "No name"}</p>
                <p className={"text-xs " + textMeta}>{home.owner.email}</p>
              </div>
            </div>
          </Link>
        ) : (
          <span className={textMeta}>No owner</span>
        )}
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center gap-1.5">
          <FileText size={14} className="text-white/50" />
          <span className="text-white/90">{home.recordCount}</span>
        </div>
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center gap-1.5">
          <Shield size={14} className="text-white/50" />
          <span className="text-white/90">{home.warrantyCount}</span>
        </div>
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center gap-1.5">
          <Link2 size={14} className="text-white/50" />
          <span className="text-white/90">{home.connectionCount}</span>
        </div>
      </td>

      <td className="py-3 pr-4">
        <span className={textMeta}>{new Date(home.createdAt).toLocaleDateString()}</span>
      </td>

      <td className="py-3 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-white/20 bg-gray-900/95 py-1 shadow-xl backdrop-blur-xl">
                <MenuLink href={"/admin/homes/" + home.id} icon={Eye} label="View Details" onClick={() => setShowMenu(false)} />
                <MenuLink href={"/admin/transfers?homeId=" + home.id} icon={ArrowLeftRight} label="View Transfers" onClick={() => setShowMenu(false)} />
                <MenuLink href={"/admin/connections?homeId=" + home.id} icon={Link2} label="View Connections" onClick={() => setShowMenu(false)} />
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
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Icon size={14} />
      {label}
    </Link>
  );
}