/**
 * ADMIN TOP BAR
 *
 * Header with logo, breadcrumbs, and quick actions.
 * Sticky positioned at top of admin pages.
 *
 * Location: app/admin/_components/AdminTopBar.tsx
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ExternalLink, Bell } from "lucide-react";

export default function AdminTopBar() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return { href, label };
  });

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-white"
          >
            <span className="rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 px-2 py-1 text-sm">
              D
            </span>
            <span className="hidden sm:inline">Dwella</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm md:flex">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <ChevronRight size={14} className="text-white/30" />
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-white">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-white/60 hover:text-white"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="relative rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            title="Notifications"
          >
            <Bell size={20} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 transition-all hover:border-white/40 hover:text-white"
          >
            View Site
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}