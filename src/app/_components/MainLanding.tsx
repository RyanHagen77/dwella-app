"use client";

import * as React from "react";
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
          <p className="mt-4 text-white/70">{byline}</p>
        </div>
        <div className="flex-shrink-0 text-center md:text-right">
          <div
            className={`text-3xl md:text-4xl font-bold ${
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
   HOMEOWNER HERO – FRICTIONLESS + HONEST
   ================================ */

function HomeownerHero({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <>
      <HeroHeader
        headline={
          <>
            Your contractor already
            <br />
            <span className="text-orange-400">documented your work.</span>
            <br />
            Claim your home to unlock it.
          </>
        }
        subhead={
          <>
            MyDwella lets contractors keep a clear record of the work they do
            at your home—photos, receipts, model numbers, and warranty details.
            When they&apos;ve documented jobs at your address, you can claim your
            home and see those records in one place instead of scattered across
            emails and paper folders.
          </>
        }
        primaryCta="Claim Your Home — Free"
        secondaryCta="See How It Works"
        trustNote="Free for homeowners. If your contractors use MyDwella, their work appears automatically once you claim your home."
        onPrimary={() => router.push("/register")}
        onSecondary={() => router.push("/demo")}
      />

      <ValueProps
        items={[
          {
            emoji: "📂",
            title: "One Home, One Record",
            description:
              "Your home’s history lives in a single place: upgrades, repairs, and maintenance, all tied to your address instead of random folders.",
          },
          {
            emoji: "🧰",
            title: "Details from the Pros",
            description:
              "Contractors can add what they installed and when—photos, equipment details, and notes—so you’re not guessing later.",
          },
          {
            emoji: "🔍",
            title: "Ready When Someone Asks",
            description:
              "When a lender, insurer, or buyer wants to know what’s been done to the home, you can open MyDwella instead of digging through old emails.",
          },
        ]}
      />

      <HowItWorks
        steps={[
          {
            step: "1",
            title: "Claim Your Home",
            description:
              "Search your address and verify it’s yours. If any contractor has already documented work, it shows up automatically.",
          },
          {
            step: "2",
            title: "Explore Your Work History",
            description:
              "See jobs, receipts, and notes in a clear timeline. Add your own photos or documents for projects you’ve tracked yourself.",
          },
          {
            step: "3",
            title: "Invite Pros (Optional)",
            description:
              "Share a link with trusted contractors so future work gets added directly to your home’s record as it happens.",
          },
        ]}
      />

      <SocialProof
        quote="We built MyDwella so that when someone asks, “What’s actually been done to this home?” you can answer with a clear record, not a guess."
        byline="Why MyDwella exists"
        statValue="Peace of mind"
        statLabel="for big decisions about your home"
        statTone="orange"
      />

      <FinalCta
        headline={
          <>
            Your home is your biggest investment.
            <br />
            <span className="text-orange-400">
              Give its history a place to live.
            </span>
          </>
        }
        cta="Claim Your Home Free"
        note="No credit card required. Your record grows as you and your contractors add to it."
        onClick={() => router.push("/register")}
      />
    </>
  );
}

/* ================================
   PRO HERO – CLEAR, NO HYPE
   ================================ */

function ProHero({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <>
      <HeroHeader
        headline={
          <>
            Document every job.
            <br />
            <span className="text-orange-400">
              Be the one they think of first.
            </span>
          </>
        }
        subhead={
          <>
            MyDwella turns each job into a clear record your client can return
            to: what you did, what you installed, and what to expect next. When
            they look up their home later, your name is attached to real work,
            not just a business card they might have lost.
          </>
        }
        primaryCta="Apply as a Pro"
        secondaryCta="See Pro Walkthrough"
        trustNote="We’re rolling MyDwella out with a focused group of contractors first."
        onPrimary={() => router.push("/apply")}
        onSecondary={() => router.push("/demo")}
      />

      {/* Conceptual “timeline” badges rather than fake stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        <StatBadge value="On the job" label="You install, repair, or maintain" />
        <StatBadge
          value="In the record"
          label="You log what you did in a few minutes"
        />
        <StatBadge
          value="Later on"
          label="They see your name when they need help again"
        />
      </section>

      <ValueProps
        items={[
          {
            emoji: "📝",
            title: "Simple Job Documentation",
            description:
              "After each visit, add a record with what you did, parts or equipment used, and any notes your client should have for later.",
          },
          {
            emoji: "📲",
            title: "Shared with the Homeowner",
            description:
              "Your work lives in their MyDwella home record, not buried in an invoice PDF. When they look up their home, they see you attached to real jobs.",
          },
          {
            emoji: "🤝",
            title: "Natural Reasons to Follow Up",
            description:
              "Because jobs are logged with real dates and details, it’s easier to plan check-ins, reminders, and seasonal outreach that actually makes sense.",
          },
        ]}
      />

      <HowItWorks
        steps={[
          {
            step: "1",
            title: "Log the Job",
            description:
              "Right after a visit, create a job record with photos, notes, and key details. It only takes a few minutes once you’re used to it.",
          },
          {
            step: "2",
            title: "Connect it to the Home",
            description:
              "Tie the job to your client’s address. When they claim their home, your work appears in their history automatically.",
          },
          {
            step: "3",
            title: "Use the History You’ve Built",
            description:
              "Look back at your own records when planning outreach or responding to questions. You and the homeowner are literally on the same page.",
          },
        ]}
      />

      <SocialProof
        quote="Instead of hoping clients keep your paperwork, you leave a living record attached to their home. When they’re ready for the next step, they can see exactly who helped them last time."
        byline="The kind of relationship MyDwella is designed to support"
        statValue="Real context"
        statLabel="for every future call, visit, or quote"
        statTone="green"
      />

      {/* Pricing – product fact, not performance claim */}
      <section className="text-center space-y-8">
        <div className="space-y-2">
          <h2 className={H2}>Straightforward Pricing for Pros</h2>
          <p className="text-white/70">
            A simple subscription for contractors who want their work to speak
            for them long after the truck leaves the driveway.
          </p>
        </div>

        <div className="inline-block rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-md">
          <div className="text-5xl font-bold text-white">$49</div>
          <div className="text-white/60 mt-1">/month</div>
          <ul className="mt-6 space-y-2 text-left text-white/80">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Document as many jobs
              as you need
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Homeowner-visible
              records with your name on them
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Tools built for
              follow-ups based on real work, not cold outreach
            </li>
          </ul>
          <button
            onClick={() => router.push("/apply")}
            className="mt-8 w-full rounded-full bg-orange-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition"
            type="button"
          >
            Apply to Join
          </button>
          <p className="mt-3 text-xs text-white/50">
            We’ll reach out with details as we expand to more service areas and
            trades.
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
   LOGO
   ================================ */

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