"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

/* =========================
   Modal-standard field system
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
  // safari/chrome autofill “brown/yellow” fix
  "autofill:shadow-[0_0_0px_1000px_rgba(0,0,0,0.35)_inset] " +
  "autofill:[-webkit-text-fill-color:#fff]";

const fieldInner =
  "w-full bg-transparent px-4 py-2.5 text-white placeholder:text-white/40 " +
  "text-base sm:text-sm " +
  controlReset;

const labelCaps =
  "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

/* ========================= */

export default function LoginClient() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [emailPwd, setEmailPwd] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [emailLink, setEmailLink] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busyPwd, setBusyPwd] = useState(false);
  const [busyLink, setBusyLink] = useState(false);

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusyPwd(true);

    const res = await signIn("credentials", {
      redirect: false,
      callbackUrl: "/post-auth",
      email: emailPwd,
      password,
    });

    setBusyPwd(false);

    if (res?.error) setMsg("Invalid email or password.");
    else if (res?.ok && res.url) router.push(res.url);
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusyLink(true);

    const res = await signIn("email", {
      redirect: false,
      callbackUrl: "/post-auth",
      email: emailLink,
    });

    setBusyLink(false);

    if (res?.error) setMsg("Could not send sign-in link. Please try again.");
    else setMsg("Check your email for a sign-in link.");
  }

  if (!mounted) return null;

  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-4 text-white"
      suppressHydrationWarning
    >
      {/* Background (no extra “hover layers”) */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-[url('/myhomedox_home3.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.65))]" />
      </div>

      {/* Card (no hover brightening) */}
      <div className="w-full max-w-3xl rounded-3xl border border-white/15 bg-black/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Sign in to MyDwella
          </h1>
          <p className="mt-2 text-sm text-white/75">Your home’s digital record.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Password login */}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-white/90">
              Sign in with email &amp; password
            </h2>

            <form onSubmit={onPasswordSubmit} className="space-y-4">
              <label className="block">
                <span className={labelCaps}>Email</span>
                <div className={fieldShell}>
                  <input
                    className={fieldInner}
                    type="email"
                    placeholder="you@example.com"
                    value={emailPwd}
                    onChange={(e) => setEmailPwd(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className={labelCaps}>Password</span>
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-xs text-white/70 hover:text-white underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className={`${fieldShell} relative`}>
                  <input
                    className={`${fieldInner} pr-16`}
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-xs text-white/60 hover:text-white"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                className="w-full rounded-xl border border-white/25 bg-[rgba(243,90,31,0.92)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_28px_rgba(243,90,31,0.35)] transition hover:bg-[rgba(243,90,31,0.98)] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={busyPwd}
              >
                {busyPwd ? "Signing in…" : "Log in"}
              </button>
            </form>
          </section>

          {/* Magic link + CTAs */}
          <section className="space-y-5">
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-white/90">Or get a sign-in link</h2>

              <form onSubmit={onEmailSubmit} className="space-y-4">
                <label className="block">
                  <span className={labelCaps}>Email</span>
                  <div className={fieldShell}>
                    <input
                      className={fieldInner}
                      type="email"
                      placeholder="you@example.com"
                      value={emailLink}
                      onChange={(e) => setEmailLink(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </label>

                <button
                  className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={busyLink}
                >
                  {busyLink ? "Sending…" : "Email me a sign-in link"}
                </button>
              </form>
            </div>

            <div className="h-px w-full bg-white/15" />

            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
                New to MyDwella?
              </h3>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <a
                  href="/register"
                  className="rounded-xl border border-white/25 bg-white/5 px-3 py-2.5 text-center text-xs sm:text-sm text-white/90 hover:bg-white/10"
                >
                  I’m a homeowner — Create an account
                </a>
                <a
                  href="/apply"
                  className="rounded-xl border border-white/25 bg-white/5 px-3 py-2.5 text-center text-xs sm:text-sm text-white/90 hover:bg-white/10"
                >
                  I’m a contractor — Apply for access
                </a>
              </div>

              <p className="text-[11px] text-white/60">
                Contractors apply for a pro account. We’ll review and approve quickly.
              </p>
            </div>
          </section>
        </div>

        {msg && (
          <p className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-center text-xs text-amber-100">
            {msg}
          </p>
        )}
      </div>
    </main>
  );
}