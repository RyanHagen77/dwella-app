// app/home-invite/[token]/InviteLandingClient.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const CONTAINER = "mx-auto w-full max-w-3xl px-4 md:px-8";
const CARD =
  "rounded-2xl border border-white/15 bg-white/5 p-6 md:p-8 backdrop-blur-md";

type SimplifiedInvite = {
  id: string;
  invitedEmail: string;
  invitedName: string | null;
  message: string | null;
  role: string; // or you can narrow to "HOMEOWNER" if you want
  createdAt: string | Date;
  inviter: {
    name: string | null;
    email: string;
    businessName: string | null;
    company: string | null;
    phone: string | null;
    verified: boolean;
    rating: number | null;
  };
};

export function InviteLandingClient({
  invite,
  expired,
}: {
  invite: SimplifiedInvite | null;
  expired: boolean;
}) {
  const router = useRouter();

  // --- Hooks must be called before any early returns ---
  const createdAt = invite?.createdAt ?? null;

  const sentDate = React.useMemo(() => {
    if (!createdAt) return "";

    const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
    if (Number.isNaN(d.getTime())) return "";

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [createdAt]);

  // ----- Expired state -----
  if (expired) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className={`${CONTAINER} pt-12 pb-16`}>
          <header className="mb-8 flex items-center gap-3">
            <MyDwellaLogo className="h-6 w-auto" />
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">
              Invitation expired
            </span>
          </header>

          <section className={CARD}>
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-3">
              This invitation link has expired.
            </h1>
            <p className="text-sm md:text-base text-white/80 mb-4">
              For security, MyDwella invitations only stay active for a limited
              time. You can ask your contractor to send a new link, or create a
              home record yourself and invite them from inside MyDwella.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition"
              >
                Create a home record
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-full border border-white/25 bg-transparent px-6 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 transition"
              >
                Go to MyDwella homepage
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // No invite but not expired shouldn't really happen, but guard anyway
  if (!invite) {
    return null;
  }

  const {
    id,
    invitedName,
    message,
    inviter: { name, email, businessName, company, phone, verified, rating },
  } = invite;

  const displayName = invitedName ?? "there";
  const contractorLabel =
    businessName || company || name || email || "Your contractor";

  const handleAccept = () => {
    router.push(`/register?invite=${encodeURIComponent(id)}`);
  };

  const handleAlreadyAccount = () => {
    router.push(`/login?invite=${encodeURIComponent(id)}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className={`${CONTAINER} pt-8 pb-16`}>
        {/* Top strip */}
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MyDwellaLogo className="h-6 w-auto" />
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">
              Home record invitation
            </span>
          </div>
          <button
            type="button"
            onClick={handleAlreadyAccount}
            className="text-xs text-white/70 hover:text-white underline underline-offset-4"
          >
            Already have an account?
          </button>
        </header>

        {/* Main card */}
        <section className={CARD}>
          <div className="space-y-6">
            {/* Contractor chip */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 border border-white/10">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-orange-300 text-xs">
                {contractorLabel.charAt(0).toUpperCase()}
              </span>
              <span>
                Invitation from{" "}
                <span className="font-medium text-white">{contractorLabel}</span>
                {verified && (
                  <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-green-300">
                    • Verified on MyDwella
                  </span>
                )}
              </span>
            </div>

            {/* Hero copy */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-heading font-bold leading-tight">
                Hi {displayName},
                <br />
                <span className="text-orange-400">
                  your contractor wants to add work to your home record.
                </span>
              </h1>
              <p className="text-white/80 text-sm md:text-base max-w-xl">
                {contractorLabel} uses MyDwella to keep a clear record of the
                work they do at your property. When you accept this invitation,
                you&apos;ll be able to see their documentation and keep it as part
                of your home&apos;s history.
              </p>
            </div>

            {/* Summary block */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 md:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-white/50 mb-1">
                    Invitation details
                  </div>
                  <div className="text-sm md:text-base font-medium text-white">
                    Shared by {contractorLabel}
                  </div>
                </div>
                <div className="text-right text-xs text-white/60">
                  {sentDate && <div>Sent {sentDate}</div>}
                  {phone && <div className="mt-1">Phone: {phone}</div>}
                  {typeof rating === "number" && (
                    <div className="mt-1">Rating: {rating.toFixed(1)}/5</div>
                  )}
                </div>
              </div>

              {message && (
                <div className="mt-2 rounded-lg bg-white/5 p-3 text-xs md:text-sm text-white/80">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/50 mb-1">
                    Note from your contractor
                  </div>
                  <p>{message}</p>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAccept}
                className="w-full rounded-full bg-orange-500 px-6 py-3.5 text-sm md:text-base font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition"
              >
                Accept invitation &amp; create your home record
              </button>
              <p className="text-xs text-white/55">
                You&apos;ll create a free MyDwella account so this contractor&apos;s
                work can live in your home&apos;s record. No credit card required,
                and you&apos;re always in control of who has access.
              </p>
            </div>
          </div>
        </section>

        {/* What is MyDwella? */}
        <section className="mt-8 space-y-4 text-sm text-white/75">
          <h2 className="text-xs uppercase tracking-[0.18em] text-white/40">
            What is MyDwella?
          </h2>
          <p>
            MyDwella is a home record built around real work done at your
            property. Contractors can attach photos, receipts, and details to
            your address, and you can add your own notes and documents too.
          </p>
          <p>
            That way, when someone asks “What&apos;s been done to this home?”
            you have a clear answer instead of digging through inboxes and
            folders.
          </p>
          <p className="text-[11px] text-white/40">
            You&apos;re always in control. You can remove access, disconnect
            contractors, or delete your account at any time.
          </p>
        </section>
      </div>
    </main>
  );
}

/* ---------- Shared logo ---------- */

function MyDwellaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 72"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="MyDwella"
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