"use client";

import Link from "next/link";

export function Breadcrumb({
  href,
  label,
  current,
}: {
  href: string;
  label: string;       // e.g. the address
  current: string;     // e.g. "Maintenance & Repairs"
}) {
  return (
    <nav className="flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden">
      <Link
        href={href}
        className="text-white/70 hover:text-white transition-colors truncate max-w-[60vw] sm:max-w-none"
      >
        {label}
      </Link>

      <span className="text-white/50">/</span>

      <span className="text-white truncate max-w-[40vw] sm:max-w-none">
        {current}
      </span>
    </nav>
  );
}