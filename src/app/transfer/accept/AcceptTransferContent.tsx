// =============================================================================
// app/transfer/accept/AcceptTransferContent.tsx
// =============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { glass, ctaPrimary, ctaGhost, heading } from '@/lib/glass';
import { Home, User, Clock, Check, X, Loader2, Shield, FileText, Wrench, Camera } from 'lucide-react';

interface TransferHome {
  id: string;
  address: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zip: string;
  photos: string[];
}

interface TransferUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

interface Transfer {
  id: string;
  home: TransferHome;
  fromUser: TransferUser;
  recipientEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
  message?: string | null;
  token: string;
  createdAt: string;
  expiresAt: string;
}

interface AcceptTransferContentProps {
  token: string;
  userEmail: string;
}

function getHomeDisplayName(home: TransferHome) {
  return `${home.address}, ${home.city}`;
}

function getHomeFullAddress(home: TransferHome) {
  if (home.addressLine2) {
    return `${home.address}, ${home.addressLine2}, ${home.city}, ${home.state} ${home.zip}`;
  }
  return `${home.address}, ${home.city}, ${home.state} ${home.zip}`;
}

export function AcceptTransferContent({ token, userEmail }: AcceptTransferContentProps) {
  const router = useRouter();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    async function fetchTransfer() {
      try {
        const response = await fetch(`/api/transfers/accept?token=${token}`);
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
      const response = await fetch('/api/transfers/accept', {
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
    if (!confirm('Are you sure you want to decline this transfer?')) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/transfers/decline', {
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
      <Main>
        <div className={glass}>
          <div className="flex items-center gap-3 text-white/70">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading transfer details...
          </div>
        </div>
      </Main>
    );
  }

  // Error state (no transfer)
  if (error && !transfer) {
    return (
      <Main>
        <div className={`${glass} max-w-md text-center`}>
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h1 className={`text-xl font-semibold mb-2 ${heading}`}>Transfer Not Found</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <button onClick={() => router.push('/home')} className={ctaPrimary}>
            Go to My Homes
          </button>
        </div>
      </Main>
    );
  }

  if (!transfer) return null;

  const isExpired = new Date() > new Date(transfer.expiresAt);
  const isAlreadyProcessed = transfer.status !== 'PENDING';

  // Already processed state
  if (isAlreadyProcessed || isExpired) {
    return (
      <Main>
        <div className={`${glass} max-w-md text-center`}>
          <div className="w-16 h-16 rounded-full bg-neutral-500/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-neutral-400" />
          </div>
          <h1 className={`text-xl font-semibold mb-2 ${heading}`}>
            {isExpired ? 'Transfer Expired' : `Transfer ${transfer.status.toLowerCase()}`}
          </h1>
          <p className="text-white/60 mb-6">
            {isExpired
              ? 'This transfer invitation has expired. Please contact the sender for a new invitation.'
              : `This transfer has already been ${transfer.status.toLowerCase()}.`
            }
          </p>
          <button onClick={() => router.push('/home')} className={ctaPrimary}>
            Go to My Home
          </button>
        </div>
      </Main>
    );
  }

  // Result state
  if (result) {
    return (
      <Main>
        <div className={`${glass} max-w-md text-center`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            result === 'accepted' ? 'bg-green-500/20' : 'bg-neutral-500/20'
          }`}>
            {result === 'accepted'
              ? <Check className="w-8 h-8 text-green-400" />
              : <X className="w-8 h-8 text-neutral-400" />
            }
          </div>
          <h1 className={`text-xl font-semibold mb-2 ${heading}`}>
            {result === 'accepted' ? 'Welcome to Your New Home!' : 'Transfer Declined'}
          </h1>
          <p className="text-white/60 mb-6">
            {result === 'accepted'
              ? `You are now the owner of ${getHomeDisplayName(transfer.home)}. All records, warranties, and contractor connections have been transferred to you.`
              : `You have declined the transfer of ${getHomeDisplayName(transfer.home)}. The original owner has been notified.`
            }
          </p>
          <button onClick={() => router.push('/home')} className={ctaPrimary}>
            {result === 'accepted' ? 'View Your Home' : 'Go to My Homes'}
          </button>
        </div>
      </Main>
    );
  }

  // Check email match
  const emailMatches = userEmail.toLowerCase() === transfer.recipientEmail.toLowerCase();

  if (!emailMatches) {
    return (
      <Main>
        <div className={`${glass} max-w-md text-center`}>
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className={`text-xl font-semibold mb-2 ${heading}`}>Wrong Account</h1>
          <p className="text-white/60 mb-4">
            This transfer was sent to <strong className="text-white">{transfer.recipientEmail}</strong>,
            but you&apos;re logged in as <strong className="text-white">{userEmail}</strong>.
          </p>
          <p className="text-white/60 mb-6">
            Please log in with the correct account to accept this transfer.
          </p>
          <button
            onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/transfer/accept?token=${token}`)}`)}
            className={ctaPrimary}
          >
            Switch Account
          </button>
        </div>
      </Main>
    );
  }

  const expiresDate = new Date(transfer.expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Main accept UI
  return (
    <Main>
      <div className={`${glass} max-w-lg w-full`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className={`text-xl font-semibold mb-2 ${heading}`}>Home Transfer Invitation</h1>
          <p className="text-white/60">
            You&apos;ve been invited to receive ownership of a home
          </p>
        </div>

        {/* From User */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {transfer.fromUser.name?.[0] || transfer.fromUser.email[0].toUpperCase()}
          </div>
          <div>
            <p className="text-white font-medium">{transfer.fromUser.name || 'User'}</p>
            <p className="text-white/50 text-sm">{transfer.fromUser.email}</p>
          </div>
        </div>

        {/* Home Card */}
        <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
          {transfer.home.photos?.[0] && (
            <div className="relative h-40">
              <Image
                src={transfer.home.photos[0]}
                alt={getHomeDisplayName(transfer.home)}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-4 bg-white/5">
            <p className="text-white font-semibold">{getHomeDisplayName(transfer.home)}</p>
            <p className="text-white/50 text-sm">{getHomeFullAddress(transfer.home)}</p>
          </div>
        </div>

        {/* Message */}
        {transfer.message && (
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border-l-4 border-blue-500">
            <p className="text-white/80 italic">&quot;{transfer.message}&quot;</p>
          </div>
        )}

        {/* What's Included */}
        <div className="mb-6">
          <p className="text-sm font-medium text-white/70 mb-3">What&apos;s included:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white/70">Warranties</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white/70">Records</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/70">Contractors</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-white/70">Photos</span>
            </div>
          </div>
        </div>

        {/* Expiration */}
        <p className="text-white/40 text-sm text-center mb-6">
          This invitation expires on {expiresDate}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className={`${ctaGhost} flex-1`}
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className={`${ctaPrimary} flex-1 flex items-center justify-center gap-2`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Accept Transfer
              </>
            )}
          </button>
        </div>
      </div>
    </Main>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-white flex items-center justify-center p-4 relative">
      <Bg />
      {children}
    </main>
  );
}

function Bg() {
  return (
    <div className="fixed inset-0 -z-50">
      <Image
        src="/myhomedox_home3.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
    </div>
  );
}