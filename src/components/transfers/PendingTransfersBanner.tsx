// =============================================================================
// components/transfer/PendingTransferBanner.tsx
// =============================================================================
// Banner shown on home detail page when there's a pending transfer

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Clock, X, Loader2, AlertTriangle } from 'lucide-react';
import { glass, textMeta } from '@/lib/glass';
import { cn } from '@/lib/utils';
import type { TransferWithDetails } from '@/lib/transfers/types';

interface PendingTransferBannerProps {
  transfer: TransferWithDetails;
}

export function PendingTransferBanner({ transfer }: PendingTransferBannerProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/transfers/${transfer.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to cancel transfer:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const isExpired = new Date() > new Date(transfer.expiresAt);

  if (isExpired) {
    return (
      <div className={cn(
        glass,
        "p-4 border-l-4 border-neutral-500"
      )}>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-neutral-400" />
          <div>
            <p className="text-white font-medium">Transfer Expired</p>
            <p className={textMeta}>
              The transfer invitation to {transfer.recipientEmail} has expired.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      glass,
      "p-4 border-l-4 border-amber-500"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Send className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <p className="text-white font-medium">Transfer Pending</p>
            <p className={textMeta}>
              Waiting for <span className="text-white">{transfer.recipientEmail}</span> to accept.
              Expires on {new Date(transfer.expiresAt).toLocaleDateString()}.
            </p>
          </div>
        </div>
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
        >
          {isCancelling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          )}
        </button>
      </div>
    </div>
  );
}