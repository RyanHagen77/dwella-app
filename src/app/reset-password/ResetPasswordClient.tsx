// app/password/ResetPasswordClient.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) {
      setMsg("Reset link is invalid or missing.");
      return;
    }

    if (password.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data.error || "Failed to reset password.");
      } else {
        setMsg("Password updated. Redirecting to sign in…");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setMsg("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
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
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/70 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="mb-6 text-sm text-white/75">
          Choose a new password for your Mywella account.
        </p>

        {!token && (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">
            This reset link is invalid or has expired.
          </p>
        )}

        {token && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-white/70">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#F35A1F]/70 focus:ring-2 focus:ring-[#F35A1F]/30"
                placeholder="New password"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/70">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text:white/40 outline-none focus:border-[#F35A1F]/70 focus:ring-2 focus:ring-[#F35A1F]/30"
                placeholder="Confirm password"
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-xl border border-white/30 bg-[rgba(243,90,31,0.95)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_28px_rgba(243,90,31,0.35)] transition hover:bg-[rgba(243,90,31,1)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? "Updating password…" : "Update password"}
            </button>
          </form>
        )}

        {msg && (
          <p className="mt-4 text-center text-xs text-amber-200">{msg}</p>
        )}
      </div>
    </main>
  );
}