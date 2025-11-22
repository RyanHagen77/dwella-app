import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RealtorPendingPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      proStatus: true,
      proProfile: {
        select: {
          type: true,
          businessName: true,
          company: true,
        },
      },
    },
  });

  if (user?.proStatus === "APPROVED") {
    redirect("/pro/realtor/dashboard");
  }

  if (user?.proStatus === "REJECTED") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">Application Not Approved</h1>
          <p className="mb-6 text-gray-600">
            Unfortunately, your realtor application was not approved. This may be due to license
            verification issues. Please contact support.
          </p>

          <div className="space-y-3">
            <Link href="/contact" className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700">
              Contact Support
            </Link>
            <Link href="/" className="block w-full rounded-lg border border-gray-300 px-6 py-3 text-center font-medium text-gray-700 hover:bg-gray-50">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Application Under Review</h1>
        <p className="mb-6 text-gray-600">
          Thanks for applying as a realtor! We&apos;re verifying your license and reviewing your
          application.
        </p>

        <div className="mb-6 rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-900">What happens next?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>We&apos;ll verify your real estate license</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>Confirm your brokerage affiliation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>You&apos;ll receive an email when approved</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>Once approved, receive work requests and provide verified records to the homes you serve</span>
            </li>
          </ul>
        </div>

        <p className="mb-4 text-center text-sm text-gray-600">
          Application submitted as:{" "}
          <strong>
            {user?.proProfile?.businessName}
            {user?.proProfile?.company && ` at ${user.proProfile.company}`}
          </strong>
        </p>

        <Link href="/" className="block w-full rounded-lg border border-gray-300 px-6 py-3 text-center font-medium text-gray-700 hover:bg-gray-50">
          Back to Home
        </Link>
      </div>
    </main>
  );
}