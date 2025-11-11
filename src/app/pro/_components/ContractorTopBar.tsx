"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function ContractorTopBar() {
  const pathname = usePathname();

  const links = [
    { href: "/pro/contractor/dashboard", label: "Dashboard" },
    { href: "/pro/contractor/work", label: "Work Requests" },      // Jobs reimagined
    { href: "/pro/contractor/properties", label: "Properties" },   // Clients reimagined
    { href: "/pro/contractor/analytics", label: "Analytics" },     // Billing reimagined
    { href: "/pro/contractor/profile", label: "Profile" },         // Account stays similar
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/pro/dashboard"
            className="inline-flex items-center gap-3 shrink-0 group"
          >
            <Image
              src="/myhomedox_logo.png"
              alt="MyHomeDox Pro"
              width={160}
              height={44}
              priority
              className="h-7 w-auto sm:h-9 transition-opacity group-hover:opacity-90"
              sizes="(min-width: 640px) 160px, 120px"
            />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side - Sign Out */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}