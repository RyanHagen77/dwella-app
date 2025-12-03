// app/home/[homeId]/verify/VerifyHomeClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type VerifyHomeClientProps = {
  homeId: string;
};

export default function VerifyHomeClient({ homeId }: VerifyHomeClientProps) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingPostcard, setSendingPostcard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/home/${homeId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Verification failed. Double-check the code and try again.");
        return;
      }

      setSuccessMessage("Your home has been verified! Redirecting you back to your dashboard...");

      setTimeout(() => {
        router.push(`/home/${homeId}`);
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendPostcard() {
    setError(null);
    setSuccessMessage(null);
    setSendingPostcard(true);

    try {
      const res = await fetch(`/api/home/${homeId}/send-postcard`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to resend postcard. Please try again in a few minutes.");
        return;
      }

      setSuccessMessage(
        "We’ve requested a new postcard. Most postcards arrive within 5–7 business days."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSendingPostcard(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-0 text-white">
      {/* Background – same as register page */}
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

      {/* Card – aligned similar to register */}
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/70 p-7 shadow-[0_22px_55px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8 mt-[-40px]">
        {/* Header row: back to home + logo */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/home/${homeId}`}
            className="inline-flex items-center gap-1 text-xs text-white/70 transition-colors hover:text-white sm:text-sm"
          >
            <span aria-hidden>←</span>
            <span>Back to home</span>
          </Link>
          <DwellaLogo className="h-8 w-auto" />
        </div>

        {/* Title / copy */}
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Verify your home
        </h1>
        <p className="mb-5 text-sm text-white/75">
          Enter the verification code from your MyDwella postcard to confirm you own this property.
        </p>

        {/* What to expect */}
        <div className="mb-5 rounded-xl border border-white/15 bg-black/60 p-4 text-xs text-white/80 sm:text-sm">
          <p className="font-medium text-white">What to expect</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>We print and mail your postcard shortly after you claim your home.</li>
            <li>Most postcards arrive within <span className="font-semibold">5–7 business days</span>.</li>
            <li>Look for a MyDwella postcard with a <span className="font-semibold">6–8 digit code</span>.</li>
            <li>Enter that code here to unlock the <span className="font-semibold">Verified Owner</span> badge.</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/80 sm:text-sm">
              Verification code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#33C17D]/70"
              placeholder="123456"
              required
            />
            <p className="mt-1 text-xs text-white/55">
              Enter the exact digits from your postcard. You can try again if you mistype it.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="mt-2 w-full rounded-xl bg-[rgba(243,90,31,0.95)] py-2.5 text-sm font-medium text-white shadow-[0_12px_32px_rgba(243,90,31,0.35)] transition-colors hover:bg-[rgba(243,90,31,1)] disabled:opacity-60"
          >
            {submitting ? "Verifying..." : "Verify home"}
          </button>
        </form>

        {/* Status + errors */}
        {error && (
          <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm text-red-50">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-50">
            {successMessage}
          </p>
        )}

        {/* Resend postcard row */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-white/15 bg-black/60 px-3 py-3 text-xs text-white/80 sm:text-sm">
          <div className="flex flex-col">
            <span className="font-medium text-white">
              Didn&apos;t receive a postcard?
            </span>
            <span className="text-[11px] text-white/60 sm:text-xs">
              If it&apos;s been more than a week or your address changed, request a new postcard.
            </span>
          </div>
          <button
            type="button"
            onClick={handleResendPostcard}
            disabled={sendingPostcard}
            className="ml-3 whitespace-nowrap text-xs font-medium text-[#33C17D] hover:text-[#33C17D]/80 disabled:opacity-60"
          >
            {sendingPostcard ? "Resending..." : "Resend postcard"}
          </button>
        </div>
      </div>
    </main>
  );
}

/** Same Dwella logo pattern as your register page */
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