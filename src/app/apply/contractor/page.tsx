// app/pro/contractor/apply/page.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type ContractorApplyForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  licenseNo: string;
  website: string;
  bio: string;
  specialties: string;
  serviceAreas: string;
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
  "autofill:shadow-[0_0_0px_1000px_rgba(0,0,0,0.35)_inset] " +
  "autofill:[-webkit-text-fill-color:#fff]";

const fieldInner =
  "w-full bg-transparent px-4 py-2.5 text-white placeholder:text-white/40 " +
  "text-base sm:text-sm " +
  controlReset;

const textareaInner =
  "w-full bg-transparent px-4 py-3 text-white placeholder:text-white/40 resize-none " +
  "text-base sm:text-sm " +
  controlReset;

const labelCaps =
  "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

/* ========================= */

export default function ContractorApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState<ContractorApplyForm>({
    name: "",
    email: "",
    password: "",
    phone: "",
    businessName: "",
    licenseNo: "",
    website: "",
    bio: "",
    specialties: "",
    serviceAreas: "",
  });

  const set = <K extends keyof ContractorApplyForm>(k: K, v: ContractorApplyForm[K]) =>
    setFormData((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        specialties: formData.specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        serviceAreas: formData.serviceAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const response = await fetch("/api/pro/contractor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as { error?: string })?.error || "Failed to submit application");
      }

      // Auto sign-in
      const result = await signIn("credentials", {
        redirect: false,
        callbackUrl: "/post-auth",
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        setError(
          "Your application was submitted, but automatic sign-in failed. Please log in with your email and password."
        );
        setLoading(false);
        return;
      }

      if (result?.url) {
        router.push(result.url);
        return;
      }

      router.push("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  };

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
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-black/70 p-7 shadow-[0_22px_55px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
        {/* Header row inside card */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/apply"
            className="inline-flex items-center gap-1 text-xs text-white/70 transition-colors hover:text-white sm:text-sm"
          >
            <span aria-hidden>←</span>
            <span>Back to account types</span>
          </Link>
          <DwellaLogo className="h-8 w-auto" />
        </div>

        {/* Title + intro */}
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Apply as a contractor
        </h1>
        <p className="mb-5 text-sm text-white/75">
          Join MyDwella and start building a verified record of work for the homes you serve.
        </p>

        {/* Why join box */}
        <div className="mb-6 rounded-2xl border border-white/15 bg-black/55 p-4 text-sm text-white/85">
          <h2 className="mb-2 text-sm font-semibold text-white">Why join as a contractor?</h2>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2.5">
              <span className="mt-[1px] flex-shrink-0 text-base text-[#33C17D]">✓</span>
              <span>Connect and stay connected with homes you serve.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-[1px] flex-shrink-0 text-base text-[#33C17D]">✓</span>
              <span>Receive service requests, and provide a quote seamlessly.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-[1px] flex-shrink-0 text-base text-[#33C17D]">✓</span>
              <span>Store photos, notes and warranty info.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-[1px] flex-shrink-0 text-base text-[#33C17D]">✓</span>
              <span>Get discovered when homes change hands.</span>
            </li>
          </ul>
        </div>

        {/* Pricing box */}
        <div className="mb-6 rounded-2xl border border-[#33C17D]/30 bg-gradient-to-br from-[#33C17D]/10 to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="mb-1 text-sm font-semibold text-white/90">Limited Launch Pricing</h2>
              <p className="mb-3 text-xs text-white/70">First 50 contractors lock this rate in forever</p>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white sm:text-4xl">$39</span>
                <span className="text-sm text-white/70">/ month</span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-[#33C17D]/20 px-2 py-0.5 text-xs font-medium text-[#33C17D]">
                  Save 20%
                </span>
                <span className="text-xs text-white/60">when paid annually ($374/yr)</span>
              </div>

              <p className="mt-2 text-xs text-white/75">Free up to 10 clients • Up to 250 clients included</p>

              <ul className="mt-3 space-y-1 text-xs text-white/75">
                <li>• Verified documentation of every job</li>
                <li>• Automated warranty &amp; maintenance reminders</li>
                <li>• Homeowner messaging &amp; service requests</li>
                <li>• 1 monthly marketing email to your entire client list</li>
              </ul>

              <div className="mt-3 inline-flex rounded-full bg-[#33C17D]/15 px-3 py-1 text-xs font-medium text-[#33C17D]">
                Founder rate – never increases
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-white/90">Personal information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={labelCaps}>
                  Full name <span className="text-red-400">*</span>
                </span>
                <div className={fieldShell}>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => set("name", e.target.value)}
                    className={fieldInner}
                    placeholder="John Smith"
                    autoComplete="name"
                  />
                </div>
              </label>

              <label className="block">
                <span className={labelCaps}>
                  Email <span className="text-red-400">*</span>
                </span>
                <div className={fieldShell}>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={fieldInner}
                    placeholder="john@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block">
                <span className={labelCaps}>
                  Password <span className="text-red-400">*</span>
                </span>
                <div className={fieldShell}>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => set("password", e.target.value)}
                    className={fieldInner}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                  />
                </div>
              </label>

              <label className="block sm:col-span-2">
                <span className={labelCaps}>
                  Phone number <span className="text-red-400">*</span>
                </span>
                <div className={fieldShell}>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className={fieldInner}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                  />
                </div>
              </label>
            </div>
          </section>

          {/* Business Information */}
          <section className="border-t border-white/15 pt-5">
            <h2 className="mb-3 text-sm font-semibold text-white/90">Business information</h2>

            <div className="space-y-4">
              <label className="block">
                <span className={labelCaps}>
                  Business name <span className="text-red-400">*</span>
                </span>
                <div className={fieldShell}>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => set("businessName", e.target.value)}
                    className={fieldInner}
                    placeholder="Mike's HVAC Service"
                    autoComplete="organization"
                  />
                </div>
              </label>

              <div>
                <label className="block">
                  <span className={labelCaps}>
                    License number <span className="text-white/55">(optional)</span>
                  </span>
                  <div className={fieldShell}>
                    <input
                      type="text"
                      value={formData.licenseNo}
                      onChange={(e) => set("licenseNo", e.target.value)}
                      className={fieldInner}
                      placeholder="IL-HVAC-12345"
                    />
                  </div>
                </label>
                <p className="mt-2 text-xs text-white/55">
                  Providing a license number helps build trust with homeowners.
                </p>
              </div>

              <label className="block">
                <span className={labelCaps}>
                  Website <span className="text-white/55">(optional)</span>
                </span>
                <div className={fieldShell}>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => set("website", e.target.value)}
                    className={fieldInner}
                    placeholder="https://www.example.com"
                    autoComplete="url"
                  />
                </div>
              </label>

              <div>
                <label className="block">
                  <span className={labelCaps}>
                    Specialties <span className="text-white/55">(optional)</span>
                  </span>
                  <div className={fieldShell}>
                    <input
                      type="text"
                      value={formData.specialties}
                      onChange={(e) => set("specialties", e.target.value)}
                      className={fieldInner}
                      placeholder="HVAC, Plumbing, Electrical"
                    />
                  </div>
                </label>
                <p className="mt-2 text-xs text-white/55">Separate multiple specialties with commas.</p>
              </div>

              <div>
                <label className="block">
                  <span className={labelCaps}>
                    Service areas <span className="text-white/55">(optional)</span>
                  </span>
                  <div className={fieldShell}>
                    <input
                      type="text"
                      value={formData.serviceAreas}
                      onChange={(e) => set("serviceAreas", e.target.value)}
                      className={fieldInner}
                      placeholder="60098, Woodstock, McHenry County"
                    />
                  </div>
                </label>
                <p className="mt-2 text-xs text-white/55">
                  Add zip codes, cities, or regions separated by commas.
                </p>
              </div>

              <label className="block">
                <span className={labelCaps}>
                  About your business <span className="text-white/55">(optional)</span>
                </span>
                <div className={fieldShell}>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    rows={5}
                    className={textareaInner}
                    placeholder="Tell us about your experience, services, and what makes you stand out..."
                  />
                </div>
              </label>
            </div>
          </section>

          {/* Submit */}
          <section className="border-t border-white/15 pt-5">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[rgba(243,90,31,0.95)] px-6 py-3 text-sm font-medium text-white shadow-[0_12px_32px_rgba(243,90,31,0.35)] transition-colors hover:bg-[rgba(243,90,31,1)] disabled:opacity-60 sm:text-base"
            >
              {loading ? "Submitting..." : "Submit application"}
            </button>
            <p className="mt-3 text-center text-xs text-white/65">
              We&apos;ll review your application within 1–2 business days.
            </p>
          </section>
        </form>
      </div>
    </main>
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