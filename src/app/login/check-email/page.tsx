import Image from "next/image";
import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 text-white">
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
        <div className="absolute inset-0 bg-black/55" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/70 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#33C17D]/20 border border-[#33C17D]/40">
          <svg
            className="h-8 w-8 text-[#33C17D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="mb-6 text-sm text-white/75">
          A sign-in link has been sent to your email address. Click the link to sign in.
        </p>

        <div className="rounded-lg border border-white/15 bg-white/5 p-4 text-left text-sm text-white/80">
          <p className="mb-2 font-medium">Didn&apos;t receive the email?</p>
          <ul className="space-y-1 text-xs text-white/70">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you entered the correct email</li>
            <li>• The link expires after 24 hours</li>
          </ul>
        </div>

        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-[#33C17D] hover:text-[#33C17D]/80 transition-colors"
        >
          ← Back to login
        </Link>
      </div>
    </main>
  );
}