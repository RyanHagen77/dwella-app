"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
        setError(data.error || "Something went wrong");
      } else {
        setMessage(
          "If an account exists with that email, you'll receive a password reset link shortly."
        );
        setEmail(""); // Clear form
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
        <div className="absolute inset-0 bg-black/55" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/70 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
          >
            <span aria-hidden>←</span>
            <span>Back to login</span>
          </Link>
        </div>

        <h1 className="mb-2 text-xl sm:text-2xl font-semibold tracking-tight">
          Forgot your password?
        </h1>
        <p className="mb-6 text-sm text-white/75">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {/* Success message */}
        {message && (
          <div className="mb-6 rounded-lg border border-[#33C17D]/40 bg-[#33C17D]/15 px-4 py-3 text-sm text-white">
            {message}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/70">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#F35A1F]/70 focus:ring-2 focus:ring-[#F35A1F]/30"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

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