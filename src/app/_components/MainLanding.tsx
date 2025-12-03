"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

type Audience = "home" | "pro";

const CONTAINER = "mx-auto w-full max-w-6xl px-4 md:px-8";
const SECTION_STACK = "space-y-16 md:space-y-20";
const CARD =
  "rounded-2xl border border-white/15 bg-white/5 p-6 md:p-8 backdrop-blur-md hover:bg-white/10 transition";
const H2 = "text-2xl font-semibold text-white";
const H3 = "text-lg font-semibold text-white";

export default function MainLanding() {
  const router = useRouter();
  const search = useSearchParams();

  const initialAud = (search.get("audience") as Audience) || "home";
  const [aud, setAud] = React.useState<Audience>(initialAud);

  // Keep URL in sync without capturing unstable searchParams object
  React.useEffect(() => {
    const qs = new URLSearchParams(search.toString());
    const current = qs.get("audience") as Audience | null;
    if (current === aud) return;
    qs.set("audience", aud);
    router.replace(`/?${qs.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aud, router]);

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      {/* Top bar */}
      <header className={`${CONTAINER} pt-4`}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="cursor-pointer flex items-center gap-3 shrink-0"
            aria-label="MyDwella home"
          >
            <MyDwellaLogo className="h-8 w-auto sm:h-10" />
          </button>

          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 backdrop-blur-sm transition"
          >
            Login / Create Account
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-10 md:pt-16">
        <div className={CONTAINER}>
          {/* Audience Toggle */}
          <AudienceToggle aud={aud} setAud={setAud} />

          {/* Content */}
          <div className={SECTION_STACK}>
            {aud === "home" ? (
              <HomeownerHero router={router} />
            ) : (
              <ProHero router={router} />
            )}
          </div>
        </div>
      </section>

      <div className="h-16 md:h-24" />
    </main>
  );
}

/* ================================
   AUDIENCE TOGGLE
   ================================ */
function AudienceToggle({
  aud,
  setAud,
}: {
  aud: Audience;
  setAud: React.Dispatch<React.SetStateAction<Audience>>;
}) {
  const pillBase =
    "px-4 py-1.5 text-sm rounded-full transition flex items-center justify-center font-medium";
  const pillActive =
    "bg-orange-500 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.15),0_8px_24px_rgba(255,140,0,0.35)]";
  const pillInactive =
    "text-white/85 hover:text-white hover:bg-orange-500/10";

  return (
    <div className="mb-10 md:mb-12 inline-flex overflow-hidden rounded-full border border-orange-400/40 bg-orange-500/10 p-0.5 backdrop-blur-sm">
      <button
        onClick={() => setAud("home")}
        className={`${pillBase} ${aud === "home" ? pillActive : pillInactive}`}
        type="button"
      >
        For Homeowners
      </button>
      <button
        onClick={() => setAud("pro")}
        className={`${pillBase} ${aud === "pro" ? pillActive : pillInactive}`}
        type="button"
      >
        For Pros
      </button>
    </div>
  );
}

/* ================================
   SHARED HERO BLOCKS
   ================================ */

function HeroHeader({
  headline,
  subhead,
  primaryCta,
  secondaryCta,
  trustNote,
  onPrimary,
  onSecondary,
}: {
  headline: React.ReactNode;
  subhead: React.ReactNode;
  primaryCta: string;
  secondaryCta: string;
  trustNote: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold leading-[1.1] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
        {headline}
      </h1>

      <p className="max-w-2xl text-lg md:text-xl text-white/90 leading-relaxed">
        {subhead}
      </p>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={onPrimary}
          className="rounded-full bg-orange-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition"
          type="button"
        >
          {primaryCta}
        </button>
        <button
          onClick={onSecondary}
          className="rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-base font-medium text-white hover:bg-white/20 backdrop-blur-sm transition"
          type="button"
        >
          {secondaryCta}
        </button>
      </div>

      <p className="text-sm text-white/60">{trustNote}</p>
    </div>
  );
}

function ValueProps({
  items,
}: {
  items: { emoji: string; title: string; description: string }[];
}) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((i) => (
        <ValueCard key={i.title} {...i} />
      ))}
    </section>
  );
}

function HowItWorks({
  steps,
}: {
  steps: { step: string; title: string; description: string }[];
}) {
  return (
    <section className="space-y-6">
      <h2 className={H2}>How It Works</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <StepCard key={s.step} {...s} />
        ))}
      </div>
    </section>
  );
}

function SocialProof({
  quote,
  byline,
  statValue,
  statLabel,
  statTone = "orange",
}: {
  quote: string;
  byline: string;
  statValue: string;
  statLabel: string;
  statTone?: "orange" | "green";
}) {
  return (
    <section className={CARD}>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <p className="text-lg md:text-xl text-white italic leading-relaxed">
            {quote}
          </p>
          <p className="mt-4 text-white/70">— {byline}</p>
        </div>
        <div className="flex-shrink-0 text-center md:text-right">
          <div
            className={`text-4xl font-bold ${
              statTone === "green" ? "text-green-400" : "text-orange-400"
            }`}
          >
            {statValue}
          </div>
          <div className="text-sm text-white/60">{statLabel}</div>
        </div>
      </div>
    </section>
  );
}

function FinalCta({
  headline,
  cta,
  note,
  onClick,
}: {
  headline: React.ReactNode;
  cta: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <section className="text-center space-y-4">
      <h2 className="text-2xl md:text-3xl font-semibold text-white">
        {headline}
      </h2>
      <button
        onClick={onClick}
        className="rounded-full bg-orange-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition"
        type="button"
      >
        {cta}
      </button>
      <p className="text-sm text-white/60">{note}</p>
    </section>
  );
}

/* ================================
   HOMEOWNER HERO
   ================================ */
function HomeownerHero({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <>
      <HeroHeader
        headline={
          <>
            Not just records.
            <br />
            <span className="text-orange-400">Verified proof</span> of every
            <br />
            upgrade to your home.
          </>
        }
        subhead={
          <>
            Homes with documented maintenance history sell for{" "}
            <span className="text-white font-semibold">5-10% more</span>.
            MyDwella keeps verified records from the contractors who did the
            work—ready when you refinance, insure, or sell.
          </>
        }
        primaryCta="Start Your Home Record — Free"
        secondaryCta="See How It Works"
        trustNote="Free for homeowners. No credit card required."
        onPrimary={() => router.push("/register")}
        onSecondary={() => router.push("/demo")}
      />

      <ValueProps
        items={[
          {
            emoji: "✅",
            title: "Contractor-Verified Records",
            description:
              "Your HVAC guy, plumber, and electrician add work directly to your stats's record. Photos, receipts, warranties—all verified by the pros who did it.",
          },
          {
            emoji: "📈",
            title: "Increase Your Home Value",
            description:
              "When you sell, buyers see PROOF of every upgrade. No more 'trust me, we replaced the roof.' Show them the verified documentation.",
          },
          {
            emoji: "🔔",
            title: "Never Miss Maintenance",
            description:
              "HVAC filter due in 30 days. Water heater warranty expires in 6 months. We remind you—and connect you with pros who can help.",
          },
        ]}
      />

      <HowItWorks
        steps={[
          {
            step: "1",
            title: "Claim Your Home",
            description: "Add your property and verify ownership in 2 minutes.",
          },
          {
            step: "2",
            title: "Invite Your Contractors",
            description:
              "Connect with pros you've worked with. They verify your past work.",
          },
          {
            step: "3",
            title: "Build Your Home's Story",
            description:
              "Every repair, upgrade, and warranty—documented and ready when you need it.",
          },
        ]}
      />

      <SocialProof
        quote="“We listed with 4 years of verified maintenance records. Buyers loved it. Sold in 5 days, $22K over asking.”"
        byline="Sarah M., Denver CO"
        statValue="$22K"
        statLabel="over asking price"
        statTone="orange"
      />

      <FinalCta
        headline={
          <>
            Your home is your biggest investment.
            <br />
            <span className="text-orange-400">Document it like one.</span>
          </>
        }
        cta="Get Started Free"
        note="Join 2,000+ homeowners protecting their investment"
        onClick={() => router.push("/register")}
      />
    </>
  );
}

/* ================================
   PRO HERO
   ================================ */
function ProHero({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <>
      <HeroHeader
        headline={
          <>
            You did great work.
            <br />
            <span className="text-orange-400">Then you never heard</span>
            <br />
            from them again.
          </>
        }
        subhead={
          <>
            73% of your revenue should come from repeat clients and referrals.
            But most contractors lose touch after the job is done.{" "}
            <span className="text-white font-semibold">MyDwella fixes that.</span>
          </>
        }
        primaryCta="Start Free — First 10 Clients Free"
        secondaryCta="See How It Works"
        trustNote="Free for your first 10 clients. Then $49/month for unlimited."
        onPrimary={() => router.push("/apply")}
        onSecondary={() => router.push("/demo")}
      />

      {/* Stats Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        <StatBadge value="$8,400" label="Avg additional revenue/year" />
        <StatBadge value="73%" label="Revenue from repeat clients" />
        <StatBadge value="2 min" label="To document a job" />
      </section>

      <ValueProps
        items={[
          {
            emoji: "🔔",
            title: "Never Miss a Warranty Renewal",
            description:
              "Sarah's HVAC warranty expires in 90 days. Mike's water heater is due for service. You'll know before they do—and reach out first.",
          },
          {
            emoji: "💰",
            title: "Turn Past Clients into Revenue",
            description:
              "You've done 47 jobs this year. That's $50,000+ in future warranty and maintenance work. Stop leaving money on the table.",
          },
          {
            emoji: "🤝",
            title: "Stay Top of Mind",
            description:
              "When their friend needs a contractor, who do they recommend? The one who stayed connected. That's you.",
          },
        ]}
      />

      <HowItWorks
        steps={[
          {
            step: "1",
            title: "Document Your Work",
            description:
              "Add completed jobs with photos, receipts, and warranty info. Takes 2 minutes.",
          },
          {
            step: "2",
            title: "We Track Everything",
            description:
              "Warranties expiring, maintenance due, clients going quiet. We watch it all.",
          },
          {
            step: "3",
            title: "You Get the Call",
            description:
              "When it's time for service, they call you—not someone they found on Google.",
          },
        ]}
      />

      <SocialProof
        quote="“I installed 50 water heaters last year. MyDwella reminded me when 12 warranties were expiring. That’s $18,000 I would have lost to competitors.”"
        byline="Mike R., Johnson Plumbing"
        statValue="$18K"
        statLabel="saved from lost renewals"
        statTone="green"
      />

      {/* Comparison */}
      <section className="space-y-6">
        <h2 className={`${H2} text-center`}>
          Without MyDwella vs. With MyDwella
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 backdrop-blur-md">
            <div className="text-red-400 font-semibold mb-4 flex items-center gap-2">
              <span>❌</span> Without MyDwella
            </div>
            <ul className="space-y-3 text-white/80 text-sm">
              <li>• Install HVAC system, job done, move on</li>
              <li>• 2 years pass, warranty expires</li>
              <li>• Customer doesn&apos;t remember you</li>
              <li>• They Google &ldquo;HVAC repair near me&rdquo;</li>
              <li>• Someone else gets the $3,000 job</li>
            </ul>
            <div className="mt-4 text-red-400 font-semibold">
              Lost: $3,000+ per client
            </div>
          </div>

          <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 backdrop-blur-md">
            <div className="text-green-400 font-semibold mb-4 flex items-center gap-2">
              <span>✅</span> With MyDwella
            </div>
            <ul className="space-y-3 text-white/80 text-sm">
              <li>• Install HVAC, document it in 2 minutes</li>
              <li>• 90 days before warranty expires, you get notified</li>
              <li>• You reach out: &ldquo;Hey Sarah, time for a check-up&rdquo;</li>
              <li>• She says: &ldquo;Wow, thanks for remembering!&rdquo;</li>
              <li>• You get the $3,000 renewal + referrals</li>
            </ul>
            <div className="mt-4 text-green-400 font-semibold">
              Earned: $3,000+ per client, every time
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="text-center space-y-8">
        <div className="space-y-2">
          <h2 className={H2}>Simple Pricing</h2>
          <p className="text-white/70">
            One warranty renewal pays for a year of MyDwella.
          </p>
        </div>

        <div className="inline-block rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-md">
          <div className="text-5xl font-bold text-white">$49</div>
          <div className="text-white/60 mt-1">/month</div>
          <ul className="mt-6 space-y-2 text-left text-white/80">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Unlimited clients
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Warranty &amp; reminder tracking
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Client messaging
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Opportunity alerts
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Verified work records
            </li>
          </ul>
          <button
            onClick={() => router.push("/apply")}
            className="mt-8 w-full rounded-full bg-orange-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition"
            type="button"
          >
            Start Free Trial
          </button>
          <p className="mt-3 text-xs text-white/50">
            First 10 clients free. No credit card required.
          </p>
        </div>
      </section>
    </>
  );
}

/* ================================
   SHARED COMPONENTS (visual)
   ================================ */

function ValueCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className={CARD}>
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className={`${H3} mb-2`}>{title}</h3>
      <p className="text-sm text-white/80 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className={CARD}>
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold mb-3">
        {step}
      </div>
      <h3 className={`${H3} mb-2`}>{title}</h3>
      <p className="text-sm text-white/80 leading-relaxed">{description}</p>
    </div>
  );
}

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center rounded-xl border border-white/10 bg-white/5 py-4 px-3">
      <div className="text-2xl md:text-3xl font-bold text-orange-400">
        {value}
      </div>
      <div className="text-xs text-white/60 mt-1">{label}</div>
    </div>
  );
}

/* ================================
   BACKGROUND + LOGO
   ================================ */

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
      <div className="absolute inset-0 bg-black/50" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.5))]" />
    </div>
  );
}

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