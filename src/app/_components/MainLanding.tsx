"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";
import type { PropertyPayload } from "@/lib/types";

type Audience = "home" | "pro";

export default function MainLanding() {
  const router = useRouter();
  const search = useSearchParams();

  const initial = (search.get("audience") as Audience) || "home";
  const [aud, setAud] = React.useState<Audience>(initial);

  React.useEffect(() => {
    const qs = new URLSearchParams(search.toString());
    qs.set("audience", aud);
    router.replace(`/?${qs.toString()}`);
  }, [aud, router, search]);

  const [addr, setAddr] = React.useState("");
  const [data, setData] = React.useState<PropertyPayload | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/property/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      if (!res.ok) throw new Error("Lookup failed");
      setData(await res.json());
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const hero = React.useMemo(() => {
    if (aud === "home") {
      return {
        headline: "Your home's report card, built for trust.",
        sub: "Store repairs, upgrades, reminders and warranties. Share a verified report in one click. Invite professionals to document their work and stay connected.",
        primary: { label: "Create home record", href: "/home" },
        secondary: { label: "See sample report", href: "/report" },
        showAddress: true,
      };
    }
    return {
      headline: "Build your professional presence on the homes you serve.",
      sub: "Document your work records on client properties, maintain verified portfolios, and stay connected with homeowners and their trusted circle long after the job is done.",
      primary: { label: "Apply as a Pro", href: "/apply" },
      secondary: { label: "View sample record", href: "/report" },
      showAddress: false,
    };
  }, [aud]);

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
        <div className="absolute inset-0 bg-black/45" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
      </div>

      {/* Top bar */}
      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="cursor-pointer"
              aria-label="HomeTrace home"
            >
              <HomeTraceLogo className="h-7 w-auto sm:h-9" />
            </button>
          </div>

          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 backdrop-blur-sm"
          >
            Login / Create Account
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="px-4 pt-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Audience pills */}
          <div className="mb-4 inline-flex overflow-hidden rounded-full border border-white/20 bg-white/10 p-0.5 backdrop-blur-sm">
            <button
              onClick={() => setAud("home")}
              className={`px-3 py-1 text-xs rounded-full transition ${
                aud === "home"
                  ? "bg-white text-slate-900"
                  : "text-white/85 hover:text-white"
              }`}
            >
              For Homeowners
            </button>
            <button
              onClick={() => setAud("pro")}
              className={`px-3 py-1 text-xs rounded-full transition ${
                aud === "pro"
                  ? "bg-white text-slate-900"
                  : "text-white/85 hover:text-white"
              }`}
            >
              For Pros
            </button>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-semibold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {hero.headline}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/90 md:text-lg">
            {hero.sub}
          </p>

          {/* CTAs */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium text-white
                         bg-[rgba(243,90,31,0.85)] hover:bg-[rgba(243,90,31,0.95)]
                         border border-white/30 backdrop-blur
                         shadow-[0_8px_24px_rgba(243,90,31,.25)] transition w-full sm:w-auto"
              onClick={() => router.push(hero.primary.href)}
            >
              {hero.primary.label}
            </button>
            <button
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium
                         border border-white/40 bg-white/10 text-white hover:bg-white/20 backdrop-blur transition w-full sm:w-auto"
              onClick={() => router.push(hero.secondary.href)}
            >
              {hero.secondary.label}
            </button>
          </div>

          {/* Address input */}
          <div className="mt-8">
            <div className={hero.showAddress ? "" : "invisible"}>
              <form
                onSubmit={onLookup}
                className="flex w-full max-w-xl items-stretch gap-2 sm:gap-3"
              >
                <Input
                  placeholder="Look up an address (e.g., 2147 Oakview Dr, Austin, TX)"
                  value={addr}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement>
                  ) => setAddr(e.target.value)}
                  className="h-11 rounded-xl bg-white/95 text-slate-900 placeholder:text-slate-500
                             ring-1 ring-white/30 focus:ring-2 focus:ring-[#F35A1F]
                             shadow-[0_2px_12px_rgba(0,0,0,.12)] flex-1"
                />
                <Button
                  type="submit"
                  disabled={!addr || loading}
                  className="h-11 rounded-xl px-4 sm:min-w-[112px]
                             text-white border border-white/30 backdrop-blur
                             bg-[rgba(243,90,31,0.85)] hover:bg-[rgba(243,90,31,0.95)]
                             shadow-[0_8px_24px_rgba(243,90,31,.25)] transition"
                >
                  {loading ? "Looking…" : "Lookup"}
                </Button>
              </form>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-200">{error}</p>
            )}
          </div>
        </div>
      </section>

      {/* Content sections */}
      <section className="mx-auto mt-12 max-w-6xl px-4 md:px-8">
        {/* Value props */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {(aud === "home"
            ? [
                [
                  "Complete home history",
                  "All repairs, upgrades, and warranties in one permanent record.",
                ],
                [
                  "Verified documentation",
                  "Professionals document their work records directly on your home's record.",
                ],
                [
                  "Easy sharing",
                  "Give access to buyers, agents, or service providers with one link.",
                ],
                [
                  "Stay connected",
                  "Maintain relationships with trusted contractors who know your home.",
                ],
              ]
            : [
                [
                  "Document your work records",
                  "Create verified records of the work you do on client properties.",
                ],
                [
                  "Build your portfolio",
                  "Show your craftsmanship with a history of completed projects.",
                ],
                [
                  "Stay connected",
                  "Maintain relationships with homeowners and their trusted circle.",
                ],
                [
                  "Get discovered",
                  "When homes change hands, new owners see your quality work.",
                ],
              ]
          ).map(([t, d]) => (
            <div
              key={t as string}
              className="space-y-2 rounded-2xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-sm
                         shadow-[inset_0_1px_0_rgba(255,255,255,.25)] hover:bg-white/15 transition"
            >
              <div className="text-base font-medium">{t}</div>
              <p className="text-sm text-white/85">{d}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {(aud === "home"
            ? [
                [
                  "1",
                  "Create your record",
                  "Start with your address and we'll help build your home's history.",
                ],
                [
                  "2",
                  "Add documentation",
                  "Upload receipts and invite professionals to document their work.",
                ],
                [
                  "3",
                  "Share with confidence",
                  "Give buyers, agents, or contractors secure access when needed.",
                ],
              ]
            : [
                [
                  "1",
                  "Apply to join",
                  "Get verified as a contractor, realtor, or inspector.",
                ],
                [
                  "2",
                  "Document your work records",
                  "Add records to the homes you serve (with owner permission).",
                ],
                [
                  "3",
                  "Build your presence",
                  "Create a verifiable portfolio that travels with the homes.",
                ],
              ]
          ).map(([s, t, d]) => (
            <div
              key={s}
              className="space-y-2 rounded-2xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-sm
                         shadow-[inset_0_1px_0_rgba(255,255,255,.25)] hover:bg-white/15 transition"
            >
              <div className="text-xs text-white/70">Step {s}</div>
              <div className="text-base font-medium">{t}</div>
              <p className="text-sm text-white/85">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preview state */}
      {loading && (
        <div className="mx-auto mt-6 max-w-6xl px-4 md:px-8">
          <div className="h-24 animate-pulse rounded-2xl bg-white/10 backdrop-blur-sm" />
        </div>
      )}

      {data && (
        <section className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-6 px-4 md:grid-cols-3 md:px-8">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-sm">
            <h3 className="text-lg font-medium">Property</h3>
            <p className="text-white/85">{data.property.address}</p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-sm">
              <div className="text-xs text-white/70">Est. Value</div>
              <div className="text-lg font-semibold">
                {data.property.estValue.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-sm">
              <div className="text-xs text-white/70">Beds/Baths</div>
              <div className="text-lg font-semibold">
                {data.property.beds}/{data.property.baths}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="h-16" />
    </main>
  );
}

/** Inline HomeTrace logo based on your SVG */
function HomeTraceLogo({ className }: { className?: string }) {
  return (
  <svg
    viewBox="0 0 340 72"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="HomeTrace"
  >
    {/* House Outline */}
    <path
      d="M18 52C16.343 52 15 50.657 15 49V27.414C15 26.52 15.36 25.661 16 25.02L35.586 5.434C36.367 4.653 37.633 4.653 38.414 5.434L58 25.02C58.64 25.661 59 26.52 59 27.414V49C59 50.657 57.657 52 56 52H42C40.343 52 39 50.657 39 49V39H25V49C25 50.657 23.657 52 22 52H18Z"
      stroke="#FFFFFF"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* Checkmark */}
    <path
      d="M32.5 34L40 41.5L54 27.5"
      stroke="#33C17D"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* HomeTrace Text – single node so it kerns correctly */}
    <text
      x="80"
      y="48"
      fontFamily="Inter, Arial, sans-serif"
      fontSize="40"
      fontWeight="600"
      fill="#FFFFFF"
    >
      HomeTrace
    </text>
  </svg>
  );
}