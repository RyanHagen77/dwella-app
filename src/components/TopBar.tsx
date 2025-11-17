"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { ctaGhost } from "@/lib/glass";

type Tone = "white" | "sky";

export type TopBarLink = {
  href: string;
  label: string;
  badge?: number;
  tone?: Tone;
};

export function TopBar({
  links,
  srBrand = "HomeTrace",
  logoAlt = "HomeTrace",
}: {
  links: TopBarLink[];
  srBrand?: string;
  logoAlt?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => setOpen(false), [pathname]);

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

  return (
    <header className="sticky top-0 z-50">
      {/* header row (same spacing as landing page top bar) */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:py-5 text-white">
        {/* logo */}
        <Link href="/" className="inline-flex items-center gap-3 shrink-0">
          <span aria-hidden="true" className="block">
            <HomeTraceLogo className="h-7 w-auto sm:h-9" />
          </span>
          <span className="sr-only">{srBrand ?? logoAlt}</span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-3">
          {links.map(({ href, label, badge, tone = "white" }) => (
            <Link key={href} href={href} className={linkCn(href)}>
              {label}
              {badge && badge > 0 ? <Badge tone={tone}>{badge}</Badge> : null}
            </Link>
          ))}
        </nav>

        {/* desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {status === "authenticated" ? (
            <>
              <span className="text-white/85 text-sm">
                {session?.user?.email}
              </span>
              <button
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 backdrop-blur-sm"
            >
              Login
            </Link>
          )}
        </div>

        {/* mobile hamburger */}
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

      {/* mobile dropdown */}
      {open && (
        <div className="md:hidden">
          <div className="mx-auto max-w-7xl px-6 pb-3">
            <div className="rounded-2xl border border-white/15 bg-black/55 backdrop-blur-md p-2">
              <div className="grid grid-cols-2 gap-2">
                {links.map(({ href, label, badge, tone = "white" }, i) => (
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
                    {badge && badge > 0 ? (
                      <Badge tone={tone}>{badge}</Badge>
                    ) : null}
                  </Link>
                ))}

                {/* mobile auth actions */}
                {status === "authenticated" ? (
                  <>
                    <div className="col-span-2 text-center text-white/85 text-sm py-1">
                      {session?.user?.email}
                    </div>
                    <button
                      className="col-span-2 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
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
    </header>
  );
}

function Badge({
  children,
  tone = "white",
}: {
  children: React.ReactNode;
  tone?: "white" | "sky";
}) {
  const toneClasses =
    tone === "sky"
      ? "border-sky-400/40 bg-sky-500/10 text-sky-100"
      : "border-white/30 bg-white/10 text-white/85";
  return (
    <span
      className={`ml-1 inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs ${toneClasses}`}
    >
      {children}
    </span>
  );
}

function HomeTraceLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 72"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="HomeTrace"
    >
      {/* House Outline */}
      <path
        d="M18 52C16.343 52 15 50.657 15 49V27.414C15 26.52 15.36 25.661 16 25.02L35.586 5.434C36.367 4.653 37.633 4.653 38.414 5.434L58 25.02C58.64 25.661 59 26.52 59 27.414V49C59 50.657 57.657 52 56 52H42C40.343 52 39 50.657 39 49V39H25V49C25 50.657 23.657 52 22 52H18Z"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Checkmark */}
      <path
        d="M32.5 34L40 41.5L54 27.5"
        stroke="#33C17D"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* HomeTrace Text – single node so it kerns correctly */}
      <text
        x="80"
        y="48"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="40"
        fontWeight="600"
        fill="#FFFFFF"
      >
        HomeTrace
      </text>
    </svg>
  );
}