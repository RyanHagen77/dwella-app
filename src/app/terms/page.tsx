// src/app/terms/page.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Terms & Privacy | MyDwella",
  description: "Terms of Service and Privacy Policy for MyDwella users.",
};

export default function TermsPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10 text-white">
      {/* Background (same pattern as login/register) */}
      <div className="fixed inset-0 -z-50">
        <Image
          src="/myhomedox_home3.webp"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      {/* Glass card */}
      <div className="w-full max-w-3xl rounded-3xl border border-white/15 bg-black/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-8">
        {/* Header row */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/register"
            className="text-sm text-white/70 hover:text-white"
          >
            ← Back to register
          </Link>
          <div className="flex items-center gap-2">
            <DwellaLogo className="h-7 w-auto sm:h-8" />
          </div>
        </div>

        {/* Title */}
        <header className="mb-4">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            MyDwella Terms of Service & Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-white/70">
            Last updated: {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </header>

        {/* Scrollable content */}
        <div className="mt-4 max-h-[65vh] space-y-8 overflow-y-auto pr-2 text-sm text-white/80">
          {/* TERMS SECTION */}
          <section>
            <h2 className="text-base font-semibold text-white">
              1. What MyDwella Does
            </h2>
            <p className="mt-2 text-white/75">
              MyDwella (&quot;we&quot;, &quot;our&quot;, &quot;the Platform&quot;)
              provides a digital record for homes and a communication hub
              between homeowners and contractors (&quot;pros&quot;). By
              creating an account or using MyDwella, you agree to these Terms.
              If you do not agree, please do not use the Platform.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  For Homeowners
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/75">
                  <li>Store home records and maintenance history</li>
                  <li>Keep verified documentation of work performed</li>
                  <li>Request maintenance or service from contractors</li>
                  <li>Organize details that help when selling your home</li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  For Contractors / Pros
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/75">
                  <li>Document work you&apos;ve completed at a property</li>
                  <li>Stay connected with your clients</li>
                  <li>Build a verified work history</li>
                  <li>Keep communication organized in one place</li>
                </ul>
              </div>
            </div>
            <p className="mt-3 text-white/75">
              MyDwella does not perform contracting work, does not guarantee
              contractor performance, and is not a party to agreements between
              homeowners and contractors.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              2. Your Responsibilities
            </h2>
            <p className="mt-2 text-white/75">
              You agree to use MyDwella responsibly and in compliance with all
              applicable laws.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
              <li>Provide accurate information when creating an account.</li>
              <li>Not use the Platform for illegal or abusive activity.</li>
              <li>Not harass, threaten, or spam other users.</li>
            </ul>
            <p className="mt-2 text-white/75">
              Contractors additionally agree to only present truthful
              qualifications, licenses, and work documentation, and to comply
              with all local regulations and licensing requirements.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              3. Messaging & Communications
            </h2>
            <p className="mt-2 text-white/75">
              MyDwella messaging is provided for coordination and
              communication between homeowners and contractors. You agree not to
              use messaging to send spam, hateful content, or illegal material.
              We may review or access communications only as needed to enforce
              safety, security, or legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              4. Payments & Work Performed
            </h2>
            <p className="mt-2 text-white/75">
              MyDwella currently does not process payments. Any agreements,
              pricing, invoices, or work arrangements are strictly between the
              homeowner and contractor.
            </p>
            <p className="mt-2 text-white/75">
              We are not responsible for quality of work, timeliness, pricing,
              or disputes between users.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              5. Account Termination
            </h2>
            <p className="mt-2 text-white/75">
              You may delete your account at any time. We may suspend or
              terminate accounts that:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
              <li>Violate these Terms;</li>
              <li>Engage in fraud or misuse;</li>
              <li>Attempt to harm the Platform or other users.</li>
            </ul>
            <p className="mt-2 text-white/75">
              Upon termination, we may delete your data except where we are
              required to retain certain information for legal, security, or
              auditing reasons.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              6. Work Documentation & Property History
            </h2>
            <p className="mt-2 text-white/75">
              Contractors may upload photos, descriptions, and details of work
              performed at a home. This information becomes part of the
              property&apos;s digital history within MyDwella.
            </p>
            <p className="mt-2 text-white/75">
              Homeowners can request removal of specific records, subject to our
              legal and safety obligations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              7. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p className="mt-2 text-white/75">
              MyDwella is provided &quot;as is&quot; without warranties of any
              kind, whether express or implied. To the fullest extent permitted
              by law, we are not liable for any indirect, incidental, or
              consequential damages arising from your use of the Platform or
              from interactions with other users.
            </p>
          </section>

          {/* PRIVACY SECTION */}
          <section className="border-t border-white/10 pt-6">
            <h2 className="text-base font-semibold text-white">
              8. Privacy Policy Overview
            </h2>
            <p className="mt-2 text-white/75">
              We respect your privacy and are committed to protecting your
              personal data. This section explains, in plain language, how we
              collect, use, and protect information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              9. Information We Collect
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
              <li>
                <span className="font-semibold">Account info:</span> name,
                email, hashed password, role (homeowner or contractor).
              </li>
              <li>
                <span className="font-semibold">Home data:</span> address,
                maintenance records, attachments, photos, work submissions.
              </li>
              <li>
                <span className="font-semibold">Contractor data:</span>{" "}
                business information, profile details, licenses (if provided).
              </li>
              <li>
                <span className="font-semibold">Communications:</span> messages
                between users sent via the Platform.
              </li>
              <li>
                <span className="font-semibold">Technical info:</span> IP
                address, device and browser info, and log data for security and
                performance.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              10. How We Use Your Information
            </h2>
            <p className="mt-2 text-white/75">
              We use your data to operate and improve MyDwella, including:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
              <li>Creating and managing your account</li>
              <li>Verifying your email and protecting against abuse</li>
              <li>Saving and displaying home and work history</li>
              <li>Facilitating messaging between homeowners and contractors</li>
              <li>Improving security, reliability, and user experience</li>
            </ul>
            <p className="mt-2 text-white/75">
              We do <span className="font-semibold">not</span> sell or rent your
              personal information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              11. How We Share Information
            </h2>
            <p className="mt-2 text-white/75">
              We share data only when necessary:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
              <li>
                With other users, as part of normal use (e.g., homeowners see
                contractor profiles and work history; contractors see relevant
                home details shared by homeowners).
              </li>
              <li>
                With service providers who help us run the Platform (hosting,
                email delivery, etc.), under appropriate data protection terms.
              </li>
              <li>
                When required by law, court order, or to prevent fraud or
                security threats.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              12. Security & Data Retention
            </h2>
            <p className="mt-2 text-white/75">
              We use modern security practices to protect your data, including
              hashed passwords, role-based access controls, and encrypted
              storage where appropriate.
            </p>
            <p className="mt-2 text-white/75">
              We retain information only as long as necessary to provide the
              service, comply with legal obligations, or resolve disputes. You
              may request deletion of your account and associated data, subject
              to these requirements.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              13. Your Rights
            </h2>
            <p className="mt-2 text-white/75">
              Depending on your location, you may have rights to access, update,
              or delete your personal information. You can also request removal
              of specific content or records, where feasible.
            </p>
            <p className="mt-2 text-white/75">
              To exercise these rights, contact us at{" "}
              <a
                href="mailto:support@mydwellaapp.com"
                className="text-[#33C17D] hover:text-[#33C17D]/80"
              >
                support@mydwella.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              14. Contact
            </h2>
            <p className="mt-2 text-white/75">
              If you have questions about these Terms or our Privacy Policy,
              please contact:
            </p>
            <p className="mt-1 text-white/80">
              <span className="font-semibold">MyDwella Support</span>
              <br />
              <a
                href="mailto:support@mydwellaapp.com"
                className="text-[#33C17D] hover:text-[#33C17D]/80"
              >
                support@mydwella.com
              </a>
            </p>
          </section>
        </div>
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