/**
 * ADMIN SIDEBAR NAVIGATION
 *
 * Sidebar with links to all admin sections.
 * Highlights active route and shows quick actions.
 *
 * Location: app/admin/_components/AdminSidebar.tsx
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Home,
  ArrowLeftRight,
  Link2,
  ClipboardList,
  Activity,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/contractors", label: "Contractors", icon: Briefcase },
  { href: "/admin/homes", label: "Homes", icon: Home },
  { href: "/admin/transfers", label: "Transfers", icon: ArrowLeftRight },
  { href: "/admin/connections", label: "Connections", icon: Link2 },
  { href: "/admin/service-requests", label: "Job Requests", icon: ClipboardList },
  { href: "/admin/system", label: "System", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="pt-6 lg:pt-8">
      <nav className="sticky top-[72px] flex flex-col gap-1">
        <div className="mb-4 px-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Admin Panel
          </h2>
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all duration-200
                ${
                  isActive
                    ? "bg-white/15 text-white shadow-lg shadow-black/20 backdrop-blur-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <Icon
                size={18}
                className={`
                  transition-colors
                  ${isActive ? "text-white" : "text-white/50 group-hover:text-white/80"}
                `}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/50">
            Quick Actions
          </p>
          <div className="space-y-2">
            <Link
              href="/admin/contractors?status=pending"
              className="block text-sm text-amber-400 hover:text-amber-300"
            >
              → Review pending pros
            </Link>
            <Link
              href="/admin/transfers?status=pending"
              className="block text-sm text-blue-400 hover:text-blue-300"
            >
              → Check transfers
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}