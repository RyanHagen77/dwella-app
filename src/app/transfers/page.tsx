// =============================================================================
// app/transfers/page.tsx
// =============================================================================
// Main transfers management page

import { getServerSession } from "next-auth";
import { redirect } from 'next/navigation';
import { authConfig } from '@/lib/auth';
import { TransfersList } from '@/components/transfers/TransfersList';
import { glass, heading, textMeta } from '@/lib/glass';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Home Transfers | Dwella',
  description: 'Manage home ownership transfers',
};

export default async function TransfersPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect('/login?redirect=/transfers');
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/home"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </Link>
          <div>
            <h1 className={`${heading} text-2xl`}>Home Transfers</h1>
            <p className={textMeta}>
              Send and receive home ownership transfers
            </p>
          </div>
        </div>

        {/* Transfers List */}
        <TransfersList />

        {/* Help Section */}
        <div className={`${glass} p-6 mt-8`}>
          <h3 className={`${heading} text-lg mb-4`}>About Home Transfers</h3>
          <div className="space-y-4 text-sm text-neutral-400">
            <p>
              Home transfers allow you to transfer full ownership of a home profile
              to another person. This is useful when selling your home, transferring
              to a family member, or in divorce situations.
            </p>
            <div>
              <p className="text-neutral-300 font-medium mb-2">What gets transferred:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Complete home profile and details</li>
                <li>All warranties and documentation</li>
                <li>Maintenance records and history</li>
                <li>Photos and documents</li>
                <li>Contractor connections and work history</li>
                <li>Reminders and scheduled maintenance</li>
              </ul>
            </div>
            <p>
              To start a transfer, go to your home's settings and select "Transfer Ownership".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
