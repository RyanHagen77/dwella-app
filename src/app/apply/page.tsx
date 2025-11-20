"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ApplySelectPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen text-white">
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

      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          {/* Logo and Back Link Row */}
          <div className="mb-8 flex w-full items-center justify-center gap-8">
            <div className="flex items-center gap-3 text-3xl font-bold">
              <svg viewBox="0 0 72 72" className="h-10 w-10" aria-hidden="true">
                <path
                  d="M18 52C16.343 52 15 50.657 15 49V27.414C15 26.52 15.36 25.661 16 25.02L35.586 5.434C36.367 4.653 37.633 4.653 38.414 5.434L58 25.02C58.64 25.661 59 26.52 59 27.414V49C59 50.657 57.657 52 56 52H42C40.343 52 39 50.657 39 49V39H25V49C25 50.657 23.657 52 22 52H18Z"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M32.5 34L40 41.5L54 27.5"
                  stroke="#33C17D"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              <span>Dwella</span>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
            >
              ← Back to login
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-white">Join Dwella</h1>
          <p className="mt-3 text-lg text-white/80">
            Create your professional contractor account
          </p>
        </div>

        {/* Contractor Card - Centered */}
        <div className="mx-auto max-w-md">
          <button
            onClick={() => router.push("/apply/contractor")}
            className="group w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl transition hover:bg-white/15 hover:scale-105"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#33C17D]/20 text-4xl mx-auto border border-[#33C17D]/30">
              🔧
            </div>
            <h2 className="mb-3 text-3xl font-bold text-white">Contractor</h2>
            <p className="mb-6 text-sm text-white/70">
              HVAC, plumbing, electrical, and all trades
            </p>
            <ul className="mb-8 space-y-3 text-left text-sm text-white/90">
              <li className="flex items-start gap-3">
                <span className="text-[#33C17D] text-lg flex-shrink-0">✓</span>
                <span>Document work on client properties</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#33C17D] text-lg flex-shrink-0">✓</span>
                <span>Build verified work portfolio</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#33C17D] text-lg flex-shrink-0">✓</span>
                <span>Get discovered by homeowners</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#33C17D] text-lg flex-shrink-0">✓</span>
                <span>Passive lead generation</span>
              </li>
            </ul>
            <div className="rounded-lg bg-gradient-to-r from-[rgba(243,90,31,0.85)] to-[rgba(243,90,31,0.75)] px-6 py-3 text-center font-medium text-white group-hover:from-[rgba(243,90,31,0.95)] group-hover:to-[rgba(243,90,31,0.85)] transition-all">
              Apply as Contractor →
            </div>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link href="/login" className="text-[#33C17D] hover:text-[#33C17D]/80 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}