export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen text-white">
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-[url('/myhomedox_home3.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
      </div>

      {children}
    </main>
  );
}