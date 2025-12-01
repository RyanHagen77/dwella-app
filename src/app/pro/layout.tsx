// src/app/pro/layout.tsx
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import GlobalProHeader from "@/app/pro/_components/GlobalProHeader";
import { ContractorContextBar } from "@/app/pro/_components/ContractorContextBar";

export default async function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authConfig);

  // Redirect if not a pro
  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  const isPending = session.user.proStatus === "PENDING";

  return (
    <div className="min-h-screen text-white">
      {/* Global pro header (no stats adding) */}
      <GlobalProHeader />

      {/* Pro-specific nav pills */}
      <ContractorContextBar />

      {/* Pending Warning Banner */}
      {isPending && (
        <div className="border-b border-yellow-400/30 bg-yellow-400/10 backdrop-blur-sm px-4 py-3">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="mr-3 h-5 w-5 text-yellow-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-yellow-100">
                  Your professional profile is pending approval. We will email
                  you when it is ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}