// app/components/ui/Breadcrumb.tsx
"use client";

import Link from "next/link";
import * as React from "react";

type BreadcrumbProps = {
  href: string;
  label: string;
  current: string;
  className?: string;
};

export function Breadcrumb({
  href,
  label,
  current,
  className = "",
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex min-w-0 items-center gap-2 text-sm ${className}`}
    >
      {/* Parent link (home address) */}
      <Link
        href={href}
        className="min-w-0 truncate text-white/70 transition-colors hover:text-white
                   max-w-[55vw] sm:max-w-none"
        title={label}
      >
        {label}
      </Link>

      <span className="flex-shrink-0 text-white/50">/</span>

      {/* Current page */}
      <span
        className="min-w-0 truncate text-white max-w-[35vw] sm:max-w-none"
        title={current}
      >
        {current}
      </span>
    </nav>
  );
}