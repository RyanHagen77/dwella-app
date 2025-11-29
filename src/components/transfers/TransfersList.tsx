// =============================================================================
// components/transfer/TransfersList.tsx
// =============================================================================
// Component showing all pending and past transfer

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Inbox,
  Home,
  Clock,
  Check,
  X,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { glass, glassTight, heading, textMeta } from '@/lib/glass';
import { cn } from '@/lib/utils';
import type { TransferWithDetails } from '@/lib/transfers/types';

// Helper to format home display name
function getHomeDisplayName(home: { address: string; city: string }) {
  return `${home.address}, ${home.city}`;
}

function getHomeFullAddress(home: { address: string; addressLine2?: string | null; city: string; state: string; zip: string }) {
  const line1 = home.addressLine2 ? `${home.address}, ${home.addressLine2}` : home.address;
  return `${line1}, ${home.city}, ${home.state} ${home.zip}`;
}

type TabType = 'sent' | 'received';

export function TransfersList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [isLoading, setIsLoading] = useState(true);
  const [sentTransfers, setSentTransfers] = useState<TransferWithDetails[]>([]);
  const [receivedTransfers, setReceivedTransfers] = useState<TransferWithDetails[]>([]);

  useEffect(() => {
    async function fetchTransfers() {
      try {
        const response = await fetch('/api/transfers');
        const data = await response.json();

        if (data.success) {
          setSentTransfers(data.sent || []);
          setReceivedTransfers(data.received || []);
        }
      } catch (err) {
        console.error('Failed to fetch transfer:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransfers();
  }, []);

  const pendingReceived = receivedTransfers.filter((t) => t.status === 'PENDING');
  const pendingSent = sentTransfers.filter((t) => t.status === 'PENDING');

  if (isLoading) {
    return (
      <div className={cn(glass, "p-8 text-center")}>
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-3" />
        <p className={textMeta}>Loading transfers...</p>
      </div>
    );
  }

  const noTransfers = sentTransfers.length === 0 && receivedTransfers.length === 0;

  if (noTransfers) {
    return (
      <div className={cn(glass, "p-8 text-center")}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-800 mb-4">
          <Send className="w-6 h-6 text-neutral-500" />
        </div>
        <h3 className={cn(heading, "text-lg mb-2")}>No Transfers</h3>
        <p className={textMeta}>
          When you send or receive home transfer requests, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  const activeTransfers = activeTab === 'sent' ? sentTransfers : receivedTransfers;

  return (
    <div className="space-y-4">
      {/* Pending Notifications */}
      {pendingReceived.length > 0 && (
        <div className={cn(
          glass,
          "p-4 border-l-4 border-blue-500"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Inbox className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">
                  {pendingReceived.length} pending transfer{pendingReceived.length > 1 ? 's' : ''} awaiting your response
                </p>
                <p className={textMeta}>
                  {pendingReceived[0].fromUser.name || pendingReceived[0].fromUser.email} wants to transfer a home to you
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('received')}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={cn(glass, "p-1 flex gap-1")}>
        <button
          onClick={() => setActiveTab('received')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'received'
              ? 'bg-white/10 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          )}
        >
          <Inbox className="w-4 h-4" />
          Received
          {pendingReceived.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs">
              {pendingReceived.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'sent'
              ? 'bg-white/10 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          )}
        >
          <Send className="w-4 h-4" />
          Sent
          {pendingSent.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs">
              {pendingSent.length}
            </span>
          )}
        </button>
      </div>

      {/* Transfer List */}
      <div className="space-y-3">
        {activeTransfers.length === 0 ? (
          <div className={cn(glass, "p-6 text-center")}>
            <p className={textMeta}>
              No {activeTab} transfers yet
            </p>
          </div>
        ) : (
          activeTransfers.map((transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              type={activeTab}
              onAction={() => router.refresh()}
            />
          ))
        )}
      </div>
    </div>
  );
}


// =============================================================================
// Transfer Card Component
// =============================================================================

interface TransferCardProps {
  transfer: TransferWithDetails;
  type: 'sent' | 'received';
  onAction: () => void;
}

function TransferCard({ transfer, type, onAction }: TransferCardProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  const homeDisplayName = getHomeDisplayName(transfer.home);
  const fullAddress = getHomeFullAddress(transfer.home);
  const homePhoto = transfer.home.photos?.[0];
  const isPending = transfer.status === 'PENDING';
  const isExpired = new Date() > new Date(transfer.expiresAt);
  const actualStatus = isPending && isExpired ? 'EXPIRED' : transfer.status;

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/transfers/${transfer.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        onAction();
      }
    } catch (err) {
      console.error('Failed to cancel transfer:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleViewTransfer = () => {
    // For received pending transfer, go to accept page
    if (type === 'received' && isPending && !isExpired) {
      router.push(`/transfer/accept?token=${transfer.token}`);
    }
  };

  const statusConfig = {
    PENDING: {
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/20',
      label: 'Pending',
    },
    ACCEPTED: {
      icon: Check,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      label: 'Completed',
    },
    DECLINED: {
      icon: X,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      label: 'Declined',
    },
    CANCELLED: {
      icon: X,
      color: 'text-neutral-400',
      bg: 'bg-neutral-500/20',
      label: 'Cancelled',
    },
    EXPIRED: {
      icon: Clock,
      color: 'text-neutral-400',
      bg: 'bg-neutral-500/20',
      label: 'Expired',
    },
  };

  const status = statusConfig[actualStatus];
  const StatusIcon = status.icon;

  return (
    <div className={cn(
      glass,
      "p-4 transition-all",
      type === 'received' && isPending && !isExpired && "cursor-pointer hover:bg-white/10"
    )}
    onClick={handleViewTransfer}
    >
      <div className="flex items-start gap-4">
        {/* Home Image/Icon */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
          {homePhoto ? (
            <img
              src={homePhoto}
              alt={homeDisplayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-6 h-6 text-neutral-600" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-white font-medium truncate">{homeDisplayName}</h4>
              <p className={cn(textMeta, "text-xs truncate")}>{fullAddress}</p>
            </div>

            {/* Status Badge */}
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full shrink-0",
              status.bg
            )}>
              <StatusIcon className={cn("w-3.5 h-3.5", status.color)} />
              <span className={cn("text-xs font-medium", status.color)}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Transfer Direction */}
          <div className="flex items-center gap-2 mt-2">
            {type === 'sent' ? (
              <>
                <span className={textMeta}>To:</span>
                <span className="text-sm text-white">{transfer.recipientEmail}</span>
              </>
            ) : (
              <>
                <span className={textMeta}>From:</span>
                <span className="text-sm text-white">
                  {transfer.fromUser.name || transfer.fromUser.email}
                </span>
              </>
            )}
          </div>

          {/* Expiration */}
          {isPending && !isExpired && (
            <p className={cn(textMeta, "text-xs mt-1")}>
              Expires {new Date(transfer.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Actions */}
        {type === 'sent' && isPending && !isExpired && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
            disabled={isCancelling}
            className={cn(
              glassTight,
              "px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
            )}
          >
            {isCancelling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Cancel'
            )}
          </button>
        )}

        {type === 'received' && isPending && !isExpired && (
          <ChevronRight className="w-5 h-5 text-neutral-500 shrink-0" />
        )}
      </div>
    </div>
  );
}

