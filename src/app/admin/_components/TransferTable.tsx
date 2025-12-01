/**
 * ADMIN TRANSFER TABLE
 *
 * Displays transfers with status, users, and actions.
 *
 * Location: app/admin/transfers/_components/TransferTable.tsx
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { textMeta } from "@/lib/glass";
import { MoreHorizontal, MapPin, ArrowRight, Mail, Clock, CheckCircle, XCircle, AlertTriangle, Ban } from "lucide-react";

type Transfer = {
  id: string;
  status: string;
  recipientEmail: string;
  createdAt: string;
  expiresAt: string | null;
  home: {
    id: string;
    address: string;
    city: string;
    state: string;
  };
  fromUser: {
    id: string;
    name: string | null;
    email: string;
  };
  toUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

export default function TransferTable({ transfers }: { transfers: Transfer[] }) {
  if (transfers.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className={textMeta}>No transfers found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-white/70">
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Property</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">From → To</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Status</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Created</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Expires</th>
            <th className="border-b border-white/10 pb-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => (
            <TransferRow key={transfer.id} transfer={transfer} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransferRow({ transfer }: { transfer: Transfer }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isPending, startTransition] = useTransition();

  const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
    PENDING: { icon: Clock, color: "text-amber-400" },
    ACCEPTED: { icon: CheckCircle, color: "text-emerald-400" },
    DECLINED: { icon: XCircle, color: "text-red-400" },
    EXPIRED: { icon: AlertTriangle, color: "text-orange-400" },
    CANCELLED: { icon: Ban, color: "text-gray-400" },
  };

  const config = statusConfig[transfer.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  const isExpired = transfer.expiresAt && new Date(transfer.expiresAt) < new Date() && transfer.status === "PENDING";

  async function handleCancel() {
    if (!confirm("Cancel this transfer?")) return;

    const res = await fetch("/api/admin/transfers/" + transfer.id + "/cancel", {
      method: "POST",
    });

    if (res.ok) {
      startTransition(() => router.refresh());
    } else {
      alert("Failed to cancel transfer");
    }
    setShowMenu(false);
  }

  return (
    <tr className="group border-b border-white/5 hover:bg-white/5">
      <td className="py-3 pr-4">
        <Link href={"/admin/homes/" + transfer.home.id} className="flex items-center gap-3 group/link">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <MapPin size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-white group-hover/link:text-emerald-400">{transfer.home.address}</p>
            <p className={"text-xs " + textMeta}>{transfer.home.city}, {transfer.home.state}</p>
          </div>
        </Link>
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <Link href={"/admin/users/" + transfer.fromUser.id} className="flex items-center gap-2 group/link">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
              {(transfer.fromUser.name || transfer.fromUser.email).charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-white group-hover/link:text-emerald-400">
              {transfer.fromUser.name || transfer.fromUser.email}
            </span>
          </Link>
          <ArrowRight size={14} className="text-white/30" />
          {transfer.toUser ? (
            <Link href={"/admin/users/" + transfer.toUser.id} className="flex items-center gap-2 group/link">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
                {(transfer.toUser.name || transfer.toUser.email).charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-white group-hover/link:text-emerald-400">
                {transfer.toUser.name || transfer.toUser.email}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-white/50" />
              <span className={"text-sm " + textMeta}>{transfer.recipientEmail}</span>
            </div>
          )}
        </div>
      </td>

      <td className="py-3 pr-4">
        <div className={"flex items-center gap-1.5 " + config.color}>
          <StatusIcon size={14} />
          <span className="text-sm">{transfer.status}</span>
        </div>
      </td>

      <td className="py-3 pr-4">
        <span className={textMeta}>{new Date(transfer.createdAt).toLocaleDateString()}</span>
      </td>

      <td className="py-3 pr-4">
        {transfer.expiresAt ? (
          <span className={isExpired ? "text-red-400" : textMeta}>
            {new Date(transfer.expiresAt).toLocaleDateString()}
          </span>
        ) : (
          <span className={textMeta}>—</span>
        )}
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
                <MenuLink href={"/admin/homes/" + transfer.home.id} label="View Home" onClick={() => setShowMenu(false)} />
                <MenuLink href={"/admin/users/" + transfer.fromUser.id} label="View Sender" onClick={() => setShowMenu(false)} />
                {transfer.status === "PENDING" && (
                  <>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      onClick={handleCancel}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      Cancel Transfer
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