// app/pro/contractor/pending/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { glass, heading, textMeta } from "@/lib/glass";

export const dynamic = "force-dynamic";

export default async function ContractorPendingPage() {
  const session = await getServerSession(authConfig);
  const userId = session?.user?.id as string | undefined;

  // Only hit the DB if we actually have a logged-in user
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          proStatus: true,
          proProfile: {
            select: {
              type: true,
              businessName: true,
            },
          },
        },
      })
    : null;

  // If logged-in PRO and approved, send them straight to contractor dashboard
  if (user?.proStatus === "APPROVED") {
    return redirect("/pro/contractor/dashboard");
  }

  // If logged-in PRO and rejected, show rejection UI
  if (user?.proStatus === "REJECTED") {
    return (
      <main className="relative min-h-screen text-white">
        <Bg />
        <div className="mx-auto max-w-2xl p-6">
          <div className={`${glass} text-center`}>
            <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-400/30 bg-red-500/20">
              <svg
                className="h-8 w-8 text-red-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h1 className={`mb-2 text-2xl font-bold ${heading}`}>
              Application Not Approved
            </h1>
            <p className={`mb-6 ${textMeta}`}>
              Unfortunately, your contractor application was not approved at this time.
              Please contact support for more information.
            </p>

            <div className="space-y-3">
              <Link
                href="/contact"
                className="block w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-center font-medium text-white transition hover:from-orange-600 hover:to-red-600"
              >
                Contact Support
              </Link>
              <Link
                href="/"
                className="block w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-center font-medium text-white transition hover:bg-white/10"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Everyone else: pending / not logged in / unknown -> show "under review" page
  const businessName = user?.proProfile?.businessName ?? "";

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Header */}
        <section className={glass}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-semibold ${heading}`}>
                Contractor Dashboard
              </h1>
              {businessName && <p className={textMeta}>{businessName}</p>}
            </div>
            <Link
              href="/"
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Home
            </Link>
          </div>
        </section>

        {/* Pending Banner */}
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,.15)]">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400/20">
              <svg
                className="h-5 w-5 text-yellow-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-100">
                Application Under Review
              </h3>
              <p className="mt-1 text-sm text-yellow-200/80">
                We&apos;re verifying your business information and credentials.
                You&apos;ll receive an email when approved (typically within 1–2
                business days).
              </p>
              {!userId && (
                <p className="mt-2 text-xs text-yellow-200/70">
                  You can safely close this tab. Once approved, you&apos;ll be able
                  to log in with the email you used to apply.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Jobs" value="0" locked />
          <StatCard title="Completed Jobs" value="0" locked />
          <StatCard title="Connected Homes" value="0" locked />
          <StatCard title="Client Contacts" value="0" locked />
        </div>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FeatureCard
            icon="🧰"
            title="Track Every Job"
            description="Create verified records of the work you complete at each home, including photos, notes, and warranty info."
          />
          <FeatureCard
            icon="🔧"
            title="Manage Service Requests"
            description="Receive service requests from homeowners, respond quickly, and keep all job details in one place."
          />
          <FeatureCard
            icon="🏠"
            title="Stay Connected to Homes"
            description="Stay linked to the homes you service so owners can find you again when they need follow-up work."
          />
          <FeatureCard
            icon="📸"
            title="Show Before & After"
            description="Save before-and-after photos that prove your craftsmanship and help win future business."
          />
        </div>

        {/* What's Next */}
        <section className={glass}>
          <h3 className={`mb-4 text-lg font-semibold ${heading}`}>
            What happens next?
          </h3>
          <div className="space-y-3">
            <Step
              number="1"
              title="Verification"
              description="We&apos;ll verify your business information and license details (if provided)."
            />
            <Step
              number="2"
              title="Email Notification"
              description="You&apos;ll receive an email as soon as your contractor account is approved."
            />
            <Step
              number="3"
              title="Full Access"
              description="Once approved, you&apos;ll unlock your full contractor dashboard to document work, manage clients, and more."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Bg() {
  return (
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
  );
}

function StatCard({
  title,
  value,
  locked,
}: {
  title: string;
  value: string;
  locked?: boolean;
}) {
  return (
    <div className={`${glass} relative ${locked ? "opacity-60" : ""}`}>
      <div className={`text-sm font-medium ${textMeta}`}>{title}</div>
      <div className={`mt-2 text-3xl font-bold ${heading}`}>{value}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className={`${glass} relative`}>
      <div className="mb-4 text-3xl" aria-hidden>
        {icon}
      </div>
      <h3 className={`text-lg font-semibold ${heading}`}>{title}</h3>
      <p className={`mt-2 text-sm ${textMeta}`}>{description}</p>
      <div className={`mt-4 text-xs ${textMeta}`}>Available after approval</div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <span className="text-xs font-bold">{number}</span>
      </div>
      <div>
        <div className={`text-sm font-medium ${heading}`}>{title}</div>
        <div className={`text-sm ${textMeta}`}>{description}</div>
      </div>
    </div>
  );
}