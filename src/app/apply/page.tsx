"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import * as React from "react";

export default function ApplySelectPage() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10 text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-50">
        <Image
          src="/myhomedox_home3.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-black/70 p-7 sm:p-8 shadow-[0_22px_55px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        {/* Header row inside card */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs sm:text-sm text-white/70 hover:text-white transition-colors"
          >
            <span aria-hidden>←</span>
            <span>Back to login</span>
          </Link>
          <DwellaLogo className="h-8 w-auto" />
        </div>

        {/* Page title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Join Dwella
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/80">
            Create your professional contractor account.
          </p>
        </div>

        {/* Contractor Card */}
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => router.push("/apply/contractor")}
            className="group w-full rounded-2xl border border-white/15 bg-black/45 backdrop-blur-xl p-8 shadow-[0_18px_45px_rgba(0,0,0,0.55)] transition-colors hover:bg-black/55"
          >
            {/* Icon */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#33C17D]/18 mx-auto border border-[#33C17D]/35">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-7 w-7 text-[#33C17D]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 7.5a5.5 5.5 0 0 1-7.7 5L7 19l-4 1 1-4 6.5-7.3A5.5 5.5 0 0 1 16.5 2L14 5l5 5 3-2.5Z" />
              </svg>
            </div>

            <h2 className="mb-2 text-2xl font-semibold text-white text-center">
              Contractor
            </h2>
            <p className="mb-6 text-sm text-white/70 text-center">
              HVAC, plumbing, electrical, and all trades.
            </p>

            <ul className="mb-7 space-y-2.5 text-left text-sm text-white/90">
              <li className="flex items-start gap-2.5">
                <span className="mt-[2px] text-[#33C17D] text-base flex-shrink-0">
                  ✓
                </span>
                <span>Document work on client properties.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-[2px] text-[#33C17D] text-base flex-shrink-0">
                  ✓
                </span>
                <span>Build a verified work portfolio tied to real homes.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-[2px] text-[#33C17D] text-base flex-shrink-0">
                  ✓
                </span>
                <span>Stay connected with homeowners after the job is done.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-[2px] text-[#33C17D] text-base flex-shrink-0">
                  ✓
                </span>
                <span>Get discovered when homes change hands.</span>
              </li>
            </ul>

            <div className="rounded-xl bg-[rgba(243,90,31,0.9)] px-6 py-3 text-center text-sm font-medium tracking-normal text-white border border-white/25 shadow-[0_12px_32px_rgba(243,90,31,0.35)] group-hover:bg-[rgba(243,90,31,0.96)] transition-colors">
              Apply as contractor →
            </div>
          </button>
        </div>

        <p className="mt-8 text-center text-xs sm:text-sm text-white/70">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#33C17D] hover:text-[#33C17D]/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

/** Inline SVG Dwella logo: house + green check + wordmark */
function DwellaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 72"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Dwella"
    >
      {/* House outline */}
      <path
        d="M18 52C16.343 52 15 50.657 15 49V27.414C15 26.52 15.36 25.661 16 25.02L35.586 5.434C36.367 4.653 37.633 4.653 38.414 5.434L58 25.02C58.64 25.661 59 26.52 59 27.414V49C59 50.657 57.657 52 56 52H42C40.343 52 39 50.657 39 49V39H25V49C25 50.657 23.657 52 22 52H18Z"
        stroke="#FFFFFF"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Checkmark */}
      <path
        d="M32.5 34L40 41.5L54 27.5"
        stroke="#33C17D"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Wordmark */}
      <text
        x={80}
        y={50}
        fill="#FFFFFF"
        fontSize={42}
        fontWeight={600}
        style={{
          fontFamily:
            '"Trebuchet MS","Segoe UI",system-ui,-apple-system,BlinkMacSystemFont,sans-serif',
          letterSpacing: 0.5,
        }}
      >
        Dwella
      </text>
    </svg>
  );
}