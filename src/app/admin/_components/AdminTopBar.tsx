"use client";

import Image from "next/image";
import Link from "next/link";

export default function AdminTopBar() {
  return (
    <div className="sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 text-white">
        <Link href="/" className="inline-flex items-center gap-3 shrink-0">
          <Image
            src="/myhomedox_logo.png"
            alt="MyDwella"
            width={160}
            height={44}
            priority
            className="h-7 w-auto sm:h-9"
            sizes="(min-width: 640px) 160px, 120px"
          />
          <span className="sr-only">MyDwella Admin</span>
        </Link>
        <div className="text-sm text-white/80">Admin Console</div>
      </div>
      <div className="mx-auto h-px max-w-7xl bg-white/15" />
    </div>
  );
}
