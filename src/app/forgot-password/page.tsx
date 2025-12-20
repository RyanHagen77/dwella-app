// app/forgot-password/page.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* =========================
   Standard field system
   - NO rings
   - focus is green border only
   - removes iOS tap highlight + autofill tint “brown”
   ========================= */

const fieldShell =
  "rounded-2xl border border-white/20 bg-black/35 backdrop-blur transition-colors overflow-hidden " +
  "focus-within:border-[#33C17D] focus-within:border-2";

const controlReset =
  "border-0 ring-0 outline-none focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 " +
  "[-webkit-tap-highlight-color:transparent] " +
  "autofill:shadow-[0_0_0px_1000px_rgba(0,0,0,0.35)_inset] " +
  "autofill:[-webkit-text-fill-color:#fff]";

const fieldInner =
  "w-full bg-transparent px-4 py-2.5 text-white placeholder:text-white/40 " +
  "text-base sm:text-sm " +
  controlReset;

const labelCaps =
  "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

/* ========================= */

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as { error?: string })?.error || "Something went wrong");
      } else {
        setMessage("If an account exists with that email, you'll receive a password reset link shortly.");
        setEmail("");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10 text-white">
      {/* Background (match login/register darkness) */}
      <div className="fixed inset-0 -z-50">
        <Image
          src="/myhomedox_home3.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.65))]" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/70 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-white/70 transition-colors hover:text-white"
          >
            <span aria-hidden>←</span>
            <span>Back to login</span>
          </Link>
        </div>

        <h1 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Forgot your password?
        </h1>
        <p className="mb-6 text-sm text-white/75">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {/* Success message */}
        {message ? (
          <div className="mb-6 rounded-2xl border border-[#33C17D]/35 bg-[#33C17D]/10 px-4 py-3 text-sm text-white">
            {message}
          </div>
        ) : null}

        {/* Error message */}
        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className={labelCaps}>Email address</span>
            <div className={fieldShell}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldInner}
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-white/30 bg-[rgba(243,90,31,0.95)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_28px_rgba(243,90,31,0.35)] transition hover:bg-[rgba(243,90,31,1)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/65">
          Remember your password?{" "}
          <Link href="/login" className="text-[#33C17D] transition-colors hover:text-[#33C17D]/80">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}