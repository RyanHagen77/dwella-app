// =============================================================================
// components/transfer/AcceptTransferContent.tsx
// =============================================================================
// Client component for accepting/declining transfer

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  User,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Clock,
  FileText,
  Wrench,
  Shield,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { glass, glassTight, heading, textMeta } from '@/lib/glass';
import { cn } from '@/lib/utils';
import type { TransferWithDetails } from '@/lib/transfer/types';

// Helper to format stats display name
function getHomeDisplayName(home: { address: string; city: string }) {
  return `${home.address}, ${home.city}`;
}

function getHomeFullAddress(home: { address: string; addressLine2?: string | null; city: string; state: string; zip: string }) {
  const line1 = home.addressLine2 ? `${home.address}, ${home.addressLine2}` : home.address;
  return `${line1}, ${home.city}, ${home.state} ${home.zip}`;
}

interface AcceptTransferContentProps {
  token: string;
  userId: string;
}

export function AcceptTransferContent({ token, userId }: AcceptTransferContentProps) {
  const router = useRouter();
  const [transfer, setTransfer] = useState<TransferWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<'accepted' | 'declined' | null>(null);

  // Fetch transfer details
  useEffect(() => {
    async function fetchTransfer() {
      try {
        const response = await fetch(`/api/transfer/accept?token=${token}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Transfer not found');
          return;
        }

        setTransfer(data.transfer);
      } catch (err) {
        setError('Failed to load transfer details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransfer();
  }, [token]);

  const handleAccept = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/transfer/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to accept transfer');
      }

      setResult('accepted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/transfer/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to decline transfer');
      }

      setResult('declined');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(glass, "p-8 max-w-md w-full text-center")}>
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
        <h2 className={heading}>Loading Transfer...</h2>
        <p className={textMeta}>Please wait while we load the transfer details</p>
      </div>
    );
  }

  // Error state (transfer not found, expired, etc.)
  if (error && !transfer) {
    return (
      <div className={cn(glass, "p-8 max-w-md w-full text-center")}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className={cn(heading, "text-xl mb-2")}>Transfer Not Available</h2>
        <p className={textMeta}>{error}</p>
        <button
          onClick={() => router.push('/home')}
          className={cn(
            glassTight,
            "mt-6 px-6 py-3 text-white font-medium",
            "hover:bg-white/10 transition-colors"
          )}
        >
          Go to My Homes
        </button>
      </div>
    );
  }

  if (!transfer) return null;

  const isExpired = transfer.status === 'EXPIRED' || new Date() > new Date(transfer.expiresAt);
  const isPending = transfer.status === 'PENDING' && !isExpired;
  const expiresDate = new Date(transfer.expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Result state - accepted or declined
  if (result) {
    return (
      <div className={cn(glass, "p-8 max-w-md w-full text-center")}>
        <div className={cn(
          "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4",
          result === 'accepted' ? 'bg-green-500/20' : 'bg-neutral-500/20'
        )}>
          {result === 'accepted' ? (
            <Check className="w-8 h-8 text-green-400" />
          ) : (
            <X className="w-8 h-8 text-neutral-400" />
          )}
        </div>

        <h2 className={cn(heading, "text-xl mb-2")}>
          {result === 'accepted' ? 'Welcome to Your New Home!' : 'Transfer Declined'}
        </h2>

        <p className={textMeta}>
          {result === 'accepted'
            ? `You are now the owner of ${getHomeDisplayName(transfer.home)}. All records, warranties, and contractor connections have been transferred to you.`
            : `You've declined the transfer of ${getHomeDisplayName(transfer.home)}. The original owner has been notified.`
          }
        </p>

        <button
          onClick={() => router.push('/home')}
          className={cn(
            "w-full mt-6 px-6 py-3 rounded-xl",
            "bg-gradient-to-r from-blue-500 to-blue-600",
            "text-white font-medium",
            "hover:from-blue-600 hover:to-blue-700 transition-all"
          )}
        >
          {result === 'accepted' ? 'View Your Home' : 'Go to My Homes'}
        </button>
      </div>
    );
  }

  // Already processed state
  if (!isPending) {
    return (
      <div className={cn(glass, "p-8 max-w-md w-full text-center")}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
          <Clock className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className={cn(heading, "text-xl mb-2")}>
          {isExpired ? 'Transfer Expired' : `Transfer ${transfer.status.toLowerCase()}`}
        </h2>
        <p className={textMeta}>
          {isExpired
            ? 'This transfer invitation has expired. Please contact the homeowner for a new invitation.'
            : `This transfer has already been ${transfer.status.toLowerCase()}.`
          }
        </p>
        <button
          onClick={() => router.push('/home')}
          className={cn(
            glassTight,
            "mt-6 px-6 py-3 text-white font-medium",
            "hover:bg-white/10 transition-colors"
          )}
        >
          Go to My Homes
        </button>
      </div>
    );
  }

  // Pending transfer - show accept/decline UI
  return (
    <div className={cn(glass, "max-w-lg w-full overflow-hidden")}>
      {/* Header */}
      <div className="p-6 border-b border-white/10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
          <Home className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className={cn(heading, "text-2xl mb-2")}>Home Transfer Invitation</h1>
        <p className={textMeta}>
          You&apos;ve been invited to receive ownership of a home
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* From User */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            {transfer.fromUser.image ? (
              <img
                src={transfer.fromUser.image}
                alt={transfer.fromUser.name || ''}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <p className="text-white font-medium">
              {transfer.fromUser.name || transfer.fromUser.email}
            </p>
            <p className={textMeta}>wants to transfer this home to you</p>
          </div>
        </div>

        {/* Home Details */}
        <div className={cn(glassTight, "p-4")}>
          {transfer.home.photos?.[0] && (
            <div className="w-full h-32 rounded-lg overflow-hidden mb-4">
              <img
                src={transfer.home.photos[0]}
                alt={getHomeDisplayName(transfer.home)}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h3 className="text-white font-semibold text-lg">{getHomeDisplayName(transfer.home)}</h3>
          <p className={textMeta}>{getHomeFullAddress(transfer.home)}</p>
        </div>

        {/* Personal Message */}
        {transfer.message && (
          <div className="p-4 rounded-lg bg-blue-500/10 border-l-2 border-blue-500">
            <p className="text-sm text-white/80 italic">"{transfer.message}"</p>
            <p className={cn(textMeta, "text-xs mt-2")}>
              — {transfer.fromUser.name || transfer.fromUser.email}
            </p>
          </div>
        )}

        {/* What's Included */}
        <div>
          <p className="text-sm font-medium text-neutral-200 mb-3">What&apos;s included:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className={cn(glassTight, "p-3 flex items-center gap-2")}>
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-neutral-300">Warranties</span>
            </div>
            <div className={cn(glassTight, "p-3 flex items-center gap-2")}>
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-neutral-300">Records</span>
            </div>
            <div className={cn(glassTight, "p-3 flex items-center gap-2")}>
              <Wrench className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-neutral-300">Contractors</span>
            </div>
            <div className={cn(glassTight, "p-3 flex items-center gap-2")}>
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-neutral-300">Photos</span>
            </div>
            {transfer.transferMessages && (
              <div className={cn(glassTight, "p-3 flex items-center gap-2 col-span-2")}>
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-neutral-300">Message History</span>
              </div>
            )}
          </div>
        </div>

        {/* Expiration Notice */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200/80">
            This invitation expires on {expiresDate}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className={cn(
              glassTight,
              "flex-1 px-6 py-3 text-white font-medium",
              "hover:bg-white/10 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Decline'
            )}
          </button>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
              "bg-gradient-to-r from-green-500 to-green-600",
              "text-white font-medium",
              "hover:from-green-600 hover:to-green-700 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Accept Transfer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}