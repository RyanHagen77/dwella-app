// src/app/pro/_components/ContractorContextBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UnreadMessageBadge } from "@/components/ui/UnreadMessageBadge";

export function ContractorContextBar() {
  const pathname = usePathname();

  const links = [
    { href: "/pro/contractor/dashboard", label: "Dashboard" },
    { href: "/pro/messages", label: "Messages", showBadge: true },
    { href: "/pro/contractor/analytics", label: "Analytics" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 pt-3 pb-2">
      {/* pill rail */}
      <nav className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-1.5 py-1.5 backdrop-blur-sm w-full sm:w-auto">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname?.startsWith(link.href + "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-white text-slate-900 font-medium shadow-sm"
                  : "bg-white/5 text-white/85 hover:bg-white/15"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {link.label}
                {link.showBadge && <UnreadMessageBadge />}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}