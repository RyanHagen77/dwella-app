"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [emailPwd, setEmailPwd] = useState("");
  const [password, setPassword] = useState("");
  const [emailLink, setEmailLink] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busyPwd, setBusyPwd] = useState(false);
  const [busyLink, setBusyLink] = useState(false);

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusyPwd(true);
    const res = await signIn("credentials", {
      redirect: true,
      callbackUrl: "/post-auth",
      email: emailPwd,
      password,
    });
    setBusyPwd(false);
    if (res?.error) setMsg("Invalid email or password");
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusyLink(true);
    const res = await signIn("email", {
      email: emailLink,
      redirect: true,
      callbackUrl: "/post-auth",
    });
    setBusyLink(false);
    if (res?.error) setMsg("Could not send link");
    else setMsg("Check your email for a sign-in link.");
  }

  if (!mounted) return null;

  return (
    <main className="mx-auto max-w-md p-6 space-y-6" suppressHydrationWarning>
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Sign in with password</h2>
        <form onSubmit={onPasswordSubmit} className="space-y-3">
          <input
            className="w-full border rounded p-2"
            type="email"
            placeholder="you@example.com"
            value={emailPwd}
            onChange={(e) => setEmailPwd(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            className="w-full border rounded p-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button className="w-full rounded p-2 bg-black text-white disabled:opacity-60" disabled={busyPwd}>
            {busyPwd ? "Signing in…" : "Log in"}
          </button>
        </form>
      </section>

      <hr />

      <section className="mt-6 space-y-2">
        <h2 className="text-sm font-medium text-gray-800">New here?</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a href="/register" className="rounded-lg border px-3 py-2 text-center hover:bg-gray-50">
            I’m a Homeowner — Create an account
          </a>
          <a href="/apply" className="rounded-lg border px-3 py-2 text-center hover:bg-gray-50">
            I’m a Professional — Apply for access
          </a>
        </div>
        <p className="text-xs text-gray-600">
          Contractors, Realtors, Inspectors apply for a pro account. We’ll review and approve quickly.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Or get a sign-in link by email</h2>
        <form onSubmit={onEmailSubmit} className="space-y-3">
          <input
            className="w-full border rounded p-2"
            type="email"
            placeholder="you@example.com"
            value={emailLink}
            onChange={(e) => setEmailLink(e.target.value)}
            required
            autoComplete="email"
          />
          <button className="w-full rounded p-2 bg-black text-white disabled:opacity-60" disabled={busyLink}>
            {busyLink ? "Sending…" : "Email me a link"}
          </button>
        </form>
      </section>

      {msg && <p className="text-sm">{msg}</p>}
    </main>
  );
}