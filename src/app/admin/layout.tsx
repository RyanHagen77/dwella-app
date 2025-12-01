/**
 * ADMIN LAYOUT
 *
 * Protected layout wrapper for all admin pages.
 * Includes sidebar navigation and top bar.
 * Enforces admin role authentication.
 *
 * Location: app/admin/layout.tsx
 */

import { requireAdmin } from "@/lib/adminAuth";
import AdminSidebar from "./_components/AdminSidebar";
import AdminTopBar from "./_components/AdminTopBar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="relative min-h-screen text-white">
      <div className="fixed inset-0 -z-50">
        <img
          src="/myhomedox_home3.webp"
          alt=""
          className="h-full w-full object-cover md:object-[50%_35%] lg:object-[50%_30%]"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
      </div>

      <AdminTopBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <AdminSidebar />
          <main className="min-h-[calc(100vh-80px)] pt-6 lg:pt-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}