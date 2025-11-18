// src/app/pro/_components/GlobalProHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { ctaGhost } from "@/lib/glass";

export type ProTopBarLink = {
  href: string;
  label: string;
};

export function GlobalProHeader({
  links = [],
  srBrand = "HomeTrace Pro",
  logoAlt = "HomeTrace Pro",
}: {
  links?: ProTopBarLink[];
  srBrand?: string;
  logoAlt?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkCn = useMemo(
    () => (href: string, extra = "") =>
      [
        ctaGhost,
        "rounded-full px-3 py-1.5 transition",
        pathname === href ? "bg-white text-slate-900 hover:bg-white" : "",
        extra,
      ].join(" "),
    [pathname]
  );

  const userInitial =
    session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? "U";

  return (
    <div
      className={`sticky top-0 z-40 transition-colors ${
        scrolled ? "bg-black/45 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      {/* header row */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:py-5 text-white">
        {/* Logo */}
        <Link
          href="/pro/contractor/dashboard"
          className="inline-flex items-center gap-3 shrink-0"
          aria-label={srBrand}
        >
          <Image
            src="/myhomedox_logo.png"
            alt={logoAlt}
            className="h-6 w-auto sm:h-8"
            width={180}
            height={40}
            priority
          />
          <span className="sr-only">{srBrand ?? logoAlt}</span>
        </Link>

        {/* (Optional) top-level nav – usually empty since pills handle nav */}
        <nav className="hidden md:flex items-center gap-3">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className={linkCn(href)}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop account menu */}
        <div className="hidden md:flex items-center gap-2">
          {status === "authenticated" && session?.user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                  {userInitial}
                </div>
                <span className="hidden sm:inline max-w-[160px] truncate text-white/85">
                  {session.user.email}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform ${
                    accountOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {accountOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAccountOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-medium text-white/90 truncate">
                        {session.user.name || "Account"}
                      </p>
                      <p className="text-xs text-white/60 truncate">
                        {session.user.email}
                      </p>
                    </div>

                    <div className="py-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountOpen(false);
                          router.push("/pro/contractor/profile");
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4s-4 1.79-4 4 1.79 4 4 4z" />
                          <path d="M6 20c0-2.21 2.686-4 6-4s6 1.79 6 4" />
                        </svg>
                        Pro account settings
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          signOut({ callbackUrl: "/login?role=pro" })
                        }
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16 17l5-5-5-5" />
                          <path d="M21 12H9" />
                          <path d="M12 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login?role=pro"
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 backdrop-blur-sm"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden">
          <div className="mx-auto max-w-7xl px-6 pb-3">
            <div className="rounded-2xl border border-white/15 bg-black/55 backdrop-blur-md p-2">
              <div className="grid grid-cols-2 gap-2">
                {links.map(({ href, label }, i) => (
                  <Link
                    key={href}
                    href={href}
                    className={linkCn(
                      href,
                      `w-full justify-center ${
                        i === links.length - 1 ? "col-span-2" : ""
                      }`
                    )}
                  >
                    {label}
                  </Link>
                ))}

                {status === "authenticated" ? (
                  <>
                    <div className="col-span-2 py-1 text-center text-sm text-white/85">
                      {session?.user?.email}
                    </div>

                    <button
                      className="col-span-2 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                      onClick={() => {
                        setOpen(false);
                        router.push("/pro/contractor/profile");
                      }}
                    >
                      Pro account settings
                    </button>

                    <button
                      className="col-span-2 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                      onClick={() => {
                        setOpen(false);
                        signOut({ callbackUrl: "/login?role=pro" });
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login?role=pro"
                    className="col-span-2 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom divider to match homeowner header */}
      <div className="mx-auto h-px max-w-7xl bg-white/15" />
    </div>
  );
}

export default GlobalProHeader;