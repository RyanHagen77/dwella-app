// =============================================================================
// components/transfer/PendingTransferIndicator.tsx
// =============================================================================
// Small indicator for nav/dashboard showing pending transfer

'use client';

import { useTransfers } from '@/hooks/useTransfers';
import { Send } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function PendingTransferIndicator() {
  const { pendingCount, isLoading } = useTransfers();

  if (isLoading || pendingCount === 0) {
    return null;
  }

  return (
    <Link
      href="/transfer"
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-blue-500/20 border border-blue-500/30",
        "hover:bg-blue-500/30 transition-colors"
      )}
    >
      <Send className="w-4 h-4 text-blue-400" />
      <span className="text-sm text-blue-300">
        {pendingCount} pending transfer{pendingCount > 1 ? 's' : ''}
      </span>
    </Link>
  );
}