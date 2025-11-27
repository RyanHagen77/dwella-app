// =============================================================================
// app/transfer/accept/page.tsx
// =============================================================================

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { AcceptTransferContent } from './AcceptTransferContent';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptTransferPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect('/');
  }

  const session = await getServerSession(authConfig);

  // If not logged in, redirect to login with return URL
  if (!session?.user) {
    redirect(`/login?redirect=${encodeURIComponent(`/transfer/accept?token=${token}`)}`);
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <AcceptTransferContent token={token} userEmail={session.user.email || ''} />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-white/50">Loading transfer details...</div>
    </main>
  );
}