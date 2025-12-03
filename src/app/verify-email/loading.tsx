// app/verify-email/loading.tsx

export default function VerifyEmailLoading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 text-white">
      {/* Same background as login/register */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-[url('/myhomedox_home3.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/15 bg-black/65 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />

        <div className="text-sm text-white/80">
          Verifying your email&hellip;
        </div>
      </div>
    </main>
  );
}