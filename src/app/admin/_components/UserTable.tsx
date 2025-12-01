/**
 * ADMIN USER TABLE
 *
 * Displays user list with actions dropdown.
 * Supports view, edit, impersonate, and suspend actions.
 *
 * Location: app/admin/users/_components/UserTable.tsx
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { textMeta } from "@/lib/glass";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  LogIn,
  Home,
  Link2,
} from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  proStatus: string | null;
  createdAt: string;
  homeCount: number;
  connectionCount: number;
};

export default function UserTable({ users }: { users: User[] }) {
  if (users.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className={textMeta}>No users found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-white/70">
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">User</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Role</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Status</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Homes</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Connections</th>
            <th className="border-b border-white/10 pb-3 pr-4 font-medium">Joined</th>
            <th className="border-b border-white/10 pb-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isPending, startTransition] = useTransition();

  const roleColors: Record<string, string> = {
    ADMIN: "border-purple-400/40 bg-purple-500/10 text-purple-200",
    PRO: "border-blue-400/40 bg-blue-500/10 text-blue-200",
    HOMEOWNER: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  };

  const proStatusColors: Record<string, string> = {
    PENDING: "border-amber-400/40 bg-amber-500/10 text-amber-200",
    APPROVED: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
    REJECTED: "border-red-400/40 bg-red-500/10 text-red-200",
  };

  const handleAction = async (action: string) => {
    setShowMenu(false);

    if (action === "view") {
      router.push(`/admin/users/${user.id}`);
      return;
    }

    if (action === "impersonate") {
      if (!confirm(`Impersonate ${user.name || user.email}? You'll be logged in as this user.`)) {
        return;
      }
      const res = await fetch(`/api/admin/users/${user.id}/impersonate`, { method: "POST" });
      if (res.ok) {
        window.location.href = "/";
      } else {
        alert("Failed to impersonate user");
      }
      return;
    }

    if (action === "suspend" || action === "activate") {
      if (!confirm(`${action === "suspend" ? "Suspend" : "Activate"} ${user.name || user.email}?`)) {
        return;
      }
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: action === "suspend" }),
      });
      if (res.ok) {
        startTransition(() => router.refresh());
      } else {
        alert(`Failed to ${action} user`);
      }
    }
  };

  return (
    <tr className="group border-b border-white/5 hover:bg-white/5">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white">{user.name || "No name"}</p>
            <p className={`text-xs ${textMeta}`}>{user.email}</p>
          </div>
        </div>
      </td>

      <td className="py-3 pr-4">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${roleColors[user.role] || "border-white/20 bg-white/10 text-white/80"}`}>
          {user.role}
        </span>
      </td>

      <td className="py-3 pr-4">
        {user.role === "PRO" && user.proStatus ? (
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${proStatusColors[user.proStatus] || ""}`}>
            {user.proStatus}
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-200">
            Active
          </span>
        )}
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center gap-1.5">
          <Home size={14} className="text-white/50" />
          <span className="text-white/90">{user.homeCount}</span>
        </div>
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center gap-1.5">
          <Link2 size={14} className="text-white/50" />
          <span className="text-white/90">{user.connectionCount}</span>
        </div>
      </td>

      <td className="py-3 pr-4">
        <span className={textMeta}>{new Date(user.createdAt).toLocaleDateString()}</span>
      </td>

      <td className="py-3 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            disabled={isPending}
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-white/20 bg-gray-900/95 py-1 shadow-xl backdrop-blur-xl">
                <MenuButton icon={Eye} label="View Details" onClick={() => handleAction("view")} />
                <MenuButton icon={Edit} label="Edit User" onClick={() => handleAction("edit")} />
                <MenuButton icon={LogIn} label="Impersonate" onClick={() => handleAction("impersonate")} />
                <div className="my-1 border-t border-white/10" />
                <MenuButton icon={Ban} label="Suspend User" onClick={() => handleAction("suspend")} danger />
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
        danger ? "text-red-400 hover:bg-red-500/10" : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}