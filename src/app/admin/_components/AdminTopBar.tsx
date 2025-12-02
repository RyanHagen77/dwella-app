/**
 * ADMIN TOP BAR
 *
 * Header with logo, admin breadcrumbs, and account actions.
 * Sticky positioned at top of admin pages.
 *
 * Location: app/admin/_components/AdminTopBar.tsx
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ChevronRight, Bell, ExternalLink } from "lucide-react";
import * as React from "react";

export default function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [scrolled, setScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setAccountOpen(false), [pathname]);

  const userInitial =
    session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? "A";

  // --- Breadcrumbs ---
  const rawSegments = pathname.split("/").filter(Boolean);
  const segments = rawSegments.filter((s) => s !== "admin");

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/admin/" + segments.slice(0, index + 1).join("/");
    const label = segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { href, label };
  });

  const isAdminRoot =
    rawSegments.length === 1 && rawSegments[0] === "admin";

  return (
    <header
      className={`sticky top-0 z-40 border-b border-white/10 transition-colors ${
        scrolled
          ? "bg-black/55 backdrop-blur-xl"
          : "bg-black/30 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-4">
          {/* FULL DWELLA LOGO */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-3 shrink-0"
            aria-label="Dwella Admin"
          >
            <DwellaLogo className="h-9 w-auto" />
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-semibold text-white">
                Admin
              </span>
            </div>
          </Link>

          {/* Breadcrumbs */}
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <span className="flex items-center gap-1">
              <ChevronRight size={14} className="text-white/30" />
              {isAdminRoot ? (
                <span className="text-white">Dashboard</span>
              ) : (
                <Link
                  href="/admin"
                  className="text-white/60 hover:text-white"
                >
                  Dashboard
                </Link>
              )}
            </span>

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

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Link
            href="/admin/notifications"
            className="relative rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />
          </Link>

          {/* View Site */}
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/80 transition-all hover:border-white/40 hover:text-white sm:inline-flex"
          >
            View site
            <ExternalLink size={14} />
          </Link>

          {/* Account Menu */}
          <div className="relative">
            {status === "authenticated" && session?.user ? (
              <>
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    {userInitial}
                  </div>
                  <span className="hidden sm:inline max-w-[150px] truncate text-white/80">
                    {session.user.email}
                  </span>
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      accountOpen ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    fill="none"
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
                          {session.user.name || "Admin account"}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                          {session.user.email}
                        </p>
                      </div>

                      <div className="py-2">
                        {/* Admin dashboard */}
                        <button
                          type="button"
                          onClick={() => {
                            setAccountOpen(false);
                            router.push("/admin");
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
                            <path d="M3 13a9 9 0 0 1 18 0" />
                            <path d="M5 21h14" />
                            <path d="M10 17v4" />
                            <path d="M14 17v4" />
                          </svg>
                          Admin dashboard
                        </button>

                        {/* User settings / profile */}
                        <button
                          type="button"
                          onClick={() => {
                            setAccountOpen(false);
                            router.push("/account"); // or "/admin/settings" if you have a dedicated admin settings page
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
                          User settings
                        </button>

                        {/* Sign out */}
                        <button
                          type="button"
                          onClick={() =>
                            signOut({ callbackUrl: "/login" })
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
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** Dwella full logo (house + checkmark + "MyDwella" text) */
function DwellaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 72"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Dwella"
    >
      <path
        d="M18 52C16.343 52 15 50.657 15 49V27.414C15 26.52 15.36 25.661 16 25.02L35.586 5.434C36.367 4.653 37.633 4.653 38.414 5.434L58 25.02C58.64 25.661 59 26.52 59 27.414V49C59 50.657 57.657 52 56 52H42C40.343 52 39 50.657 39 49V39H25V49C25 50.657 23.657 52 22 52H18Z"
        stroke="#FFFFFF"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M32.5 34L40 41.5L54 27.5"
        stroke="#33C17D"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x={80}
        y={50}
        fill="#FFFFFF"
        fontSize={39}
        fontWeight={600}
        style={{
          fontFamily:
            '"Trebuchet MS","Segoe UI",system-ui,-apple-system,BlinkMacSystemFont,sans-serif',
          letterSpacing: 0.5,
        }}
      >
        MyDwella
      </text>
    </svg>
  );
}