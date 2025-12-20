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
  // Safari/Chrome autofill (brown/yellow) suppression
  "autofill:shadow-[0_0_0px_1000px_rgba(0,0,0,0.35)_inset] " +
  "autofill:[-webkit-text-fill-color:#fff]";

const fieldInner =
  "w-full bg-transparent px-4 py-2.5 text-white placeholder:text-white/40 " +
  "text-base sm:text-sm " +
  controlReset;

const labelCaps =
  "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

/* Checkbox: keep minimal ring + consistent tint */
const checkboxBase =
  "h-4 w-4 rounded border-white/40 bg-black/60 text-[#33C17D] " +
  "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0";

/* ========================= */

function validatePasswordStrengthClient(password: string, email?: string): string | null {
  if (!password || password.length < 10) return "Password must be at least 10 characters long.";

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) return "Password must include at least one letter and one number.";

  const lower = password.toLowerCase();
  const weakFragments = ["password", "qwerty", "123456", "dwella"];
  if (weakFragments.some((frag) => lower.includes(frag))) {
    return "Password is too easy to guess. Please choose something more unique.";
  }

  if (email) {
    const localPart = email.split("@")[0]?.toLowerCase();
    if (localPart && lower.includes(localPart)) return "Password should not contain your email.";
  }

  return null;
}

function RegisterFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [form, setForm] = useState<RegisterForm>({ name: "", email: "", password: "" });

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancel = false;

    async function loadInvite() {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json().catch(() => ({}));

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

    if (!acceptedTerms) {
      setMsg("You must agree to the Terms & Conditions and Privacy Policy to create an account.");
      return;
    }

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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data.error || "Failed to register");
        setLoading(false);
        return;
      }

      const email = (data.email as string | undefined) ?? form.email;
      router.push(`/login/check-email?email=${encodeURIComponent(email)}`);
    } catch {
      setMsg("Registration failed");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10 text-white">
      {/* Background (match newer pages; keep it dark, no hover layers) */}
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

      {/* Card (slightly darker like login) */}
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/70 p-7 shadow-[0_22px_55px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
        {/* Header row */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-white/70 transition-colors hover:text-white sm:text-sm"
          >
            <span aria-hidden>←</span>
            <span>Back to login</span>
          </Link>
          <DwellaLogo className="h-8 w-auto" />
        </div>

        {/* Invitation banner */}
        {invitationData && (
          <div className="mb-6 rounded-2xl border border-[#33C17D]/35 bg-black/45 p-4">
            <p className="text-sm text-white/90">
              <strong>{invitationData.inviterName}</strong>
              {invitationData.inviterCompany ? ` (${invitationData.inviterCompany})` : ""} has invited
              you to join MyDwella.
            </p>
            {invitationData.message && (
              <p className="mt-2 text-sm italic text-white/80">“{invitationData.message}”</p>
            )}
          </div>
        )}

        <h1 className="mb-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {invitationData ? "Accept your invitation" : "Create your MyDwella account"}
        </h1>
        <p className="mb-5 text-sm text-white/75">
          Manage your home, projects, and pro history in one secure place.
        </p>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name */}
          <label className="block">
            <span className={labelCaps}>
              Full name <span className="text-red-400">*</span>
            </span>
            <div className={fieldShell}>
              <input
                className={fieldInner}
                placeholder="Jane Homeowner"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                autoComplete="name"
              />
            </div>
          </label>

          {/* Email */}
          <label className="block">
            <span className={labelCaps}>
              Email <span className="text-red-400">*</span>
            </span>

            {/* Keep same shell; when disabled, tone down inside */}
            <div className={fieldShell + (invitationData ? " opacity-[0.92]" : "")}>
              <input
                className={
                  fieldInner +
                  (invitationData
                    ? " cursor-not-allowed text-white/70 placeholder:text-white/30"
                    : "")
                }
                placeholder="you@example.com"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
                disabled={!!invitationData}
                autoComplete="email"
              />
            </div>
          </label>

          {/* Password */}
          <div>
            <span className={labelCaps}>
              Password <span className="text-red-400">*</span>
            </span>

            <div className={`${fieldShell} relative`}>
              <input
                className={fieldInner + " pr-16"}
                placeholder="Minimum 10 characters"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
                minLength={10}
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-3 flex items-center text-xs text-white/60 hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <p className="mt-2 text-xs text-white/55">Use at least 10 characters, including a number.</p>
          </div>

          {/* Terms */}
          <div className="mt-2 flex items-start gap-2">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className={checkboxBase}
              required
            />
            <label htmlFor="accept-terms" className="text-xs text-white/70 sm:text-sm">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-[#33C17D] underline-offset-2 hover:text-[#33C17D]/80 hover:underline"
              >
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-[#33C17D] underline-offset-2 hover:text-[#33C17D]/80 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-[rgba(243,90,31,0.95)] py-3 text-sm font-medium text-white shadow-[0_12px_32px_rgba(243,90,31,0.35)] transition-colors hover:bg-[rgba(243,90,31,1)] disabled:opacity-60"
          >
            {loading
              ? "Creating your account..."
              : invitationData
              ? "Accept & create account"
              : "Create account"}
          </button>
        </form>

        {msg && (
          <p className="mt-4 rounded-2xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {msg}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link href="/login" className="text-[#33C17D] hover:text-[#33C17D]/80 transition-colors">
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
      <RegisterFormInner />
    </Suspense>
  );
}

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