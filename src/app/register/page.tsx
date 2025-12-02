"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
};

type InvitationData = {
  invitedEmail: string;
  invitedName?: string | null;
  inviterName?: string | null;
  inviterCompany?: string | null;
  message?: string | null;
};

// Simple client-side mirror of the server password rules
function validatePasswordStrengthClient(password: string, email?: string): string | null {
  if (!password || password.length < 10) {
    return "Password must be at least 10 characters long.";
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return "Password must include at least one letter and one number.";
  }

  const lower = password.toLowerCase();
  const weakFragments = ["password", "qwerty", "123456", "dwella"];

  if (weakFragments.some((frag) => lower.includes(frag))) {
    return "Password is too easy to guess. Please choose something more unique.";
  }

  if (email) {
    const localPart = email.split("@")[0]?.toLowerCase();
    if (localPart && lower.includes(localPart)) {
      return "Password should not contain your email.";
    }
  }

  return null;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
  });

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);

  // Fetch invitation details
  useEffect(() => {
    if (!token) return;
    let cancel = false;

    async function loadInvite() {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();

        if (!res.ok) {
          if (!cancel) setMsg(data.error || "Invalid invitation link");
          return;
        }

        if (!cancel) {
          setForm((prev) => ({
            ...prev,
            email: data.invitedEmail ?? "",
            name: data.invitedName ?? "",
          }));
          setInvitationData(data);
        }
      } catch {
        if (!cancel) setMsg("Failed to load invitation.");
      }
    }

    loadInvite();
    return () => {
      cancel = true;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const strengthError = validatePasswordStrengthClient(form.password, form.email);
    if (strengthError) {
      setMsg(strengthError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          invitationToken: token ?? undefined,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error || "Failed to register");
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const email = data.email ?? form.email;

      // 👉 Go to "check your email" page instead of straight to login
      router.push(`/login/check-email?email=${encodeURIComponent(email)}`);
    } catch {
      setMsg("Registration failed");
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
        <div className="absolute inset-0 bg-black/65" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/70 p-7 sm:p-8 shadow-[0_22px_55px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        {/* Header row */}
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

        {/* Invitation banner */}
        {invitationData && (
          <div className="mb-6 rounded-xl border border-[#33C17D]/45 bg-black/50 p-4 shadow-sm">
            <p className="text-sm text-white/90">
              <strong>{invitationData.inviterName}</strong>
              {invitationData.inviterCompany &&
                ` (${invitationData.inviterCompany})`}{" "}
              has invited you to join MyDwella.
            </p>
            {invitationData.message && (
              <p className="mt-2 text-sm italic text-white/80">
                “{invitationData.message}”
              </p>
            )}
          </div>
        )}

        <h1 className="mb-1 text-xl sm:text-2xl font-semibold tracking-tight text-white">
          {invitationData ? "Accept your invitation" : "Create your MyDwella account"}
        </h1>
        <p className="mb-5 text-sm text-white/75">
          Manage your home, projects, and pro history in one secure place.
        </p>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs sm:text-sm font-medium text-white/80">
              Full name <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#33C17D]/70"
              placeholder="Jane Homeowner"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-xs sm:text-sm font-medium text-white/80">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#33C17D]/70 disabled:bg-black/30 disabled:text-white/50"
              placeholder="you@example.com"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
              disabled={!!invitationData}
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-xs sm:text-sm font-medium text-white/80">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#33C17D]/70"
              placeholder="Minimum 10 characters"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              required
              minLength={10}
            />
            <p className="mt-1 text-xs text-white/55">
              Use at least 10 characters, including a number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[rgba(243,90,31,0.95)] py-3 text-sm font-medium text-white shadow-[0_12px_32px_rgba(243,90,31,0.35)] transition-colors hover:bg-[rgba(243,90,31,1)] disabled:opacity-60"
          >
            {loading
              ? "Creating your account..."
              : invitationData
              ? "Accept & create account"
              : "Create account"}
          </button>
        </form>

        {msg && (
          <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm text-red-50">
            {msg}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-white/70">
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <RegisterForm />
    </Suspense>
  );
}

/** Dwella logo – house + check + wordmark */
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