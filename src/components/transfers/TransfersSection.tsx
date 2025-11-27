// =============================================================================
// components/transfers/TransfersSection.tsx
// =============================================================================
// Section in Account Settings for managing home transfers

'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { glass, ctaPrimary, heading } from '@/lib/glass';
import { Send, Inbox, ChevronDown, Loader2, Home } from 'lucide-react';
import { TransferHomeModal } from './TransferHomeModal';

interface TransferHome {
  id: string;
  address: string;
  addressLine2?: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  photos?: string[];
}

interface TransferUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

interface Transfer {
  id: string;
  homeId: string;
  home: TransferHome;
  fromUser: TransferUser;
  toUser?: TransferUser | null;
  recipientEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
  message?: string | null;
  token: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string | null;
}

function formatAddress(home: TransferHome) {
  return `${home.address}${home.city ? `, ${home.city}` : ''}`;
}

export function TransfersSection() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [homes, setHomes] = useState<TransferHome[]>([]);
  const [selectedHome, setSelectedHome] = useState<TransferHome | null>(null);
  const [homePickerOpen, setHomePickerOpen] = useState(false);
  const [pickerRect, setPickerRect] = useState<DOMRect | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [sentTransfers, setSentTransfers] = useState<Transfer[]>([]);
  const [receivedTransfers, setReceivedTransfers] = useState<Transfer[]>([]);
  const [pendingTransferHomeIds, setPendingTransferHomeIds] = useState<Set<string>>(new Set());
  const pickerButtonRef = useRef<HTMLButtonElement>(null);

  // For portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch homes and transfers
  useEffect(() => {
    async function fetchData() {
      try {
        const [homesRes, transfersRes] = await Promise.all([
          fetch('/api/user/homes'),
          fetch('/api/transfers'),
        ]);

        if (homesRes.ok) {
          const homesData = await homesRes.json();
          const homesList = homesData.homes || [];
          setHomes(homesList);
          // Set first home as default if none selected
          if (homesList.length > 0) {
            setSelectedHome(prev => prev ?? homesList[0]);
          }
        }

        if (transfersRes.ok) {
          const transfersData = await transfersRes.json();
          setSentTransfers(transfersData.sent || []);
          setReceivedTransfers(transfersData.received || []);

          // Track which homes have pending transfers
          const pendingIds = new Set<string>();
          (transfersData.sent || []).forEach((t: Transfer) => {
            if (t.status === 'PENDING' && new Date() < new Date(t.expiresAt)) {
              pendingIds.add(t.homeId);
            }
          });
          setPendingTransferHomeIds(pendingIds);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const pendingReceived = receivedTransfers.filter(
    (t) => t.status === 'PENDING' && new Date() < new Date(t.expiresAt)
  );
  const pendingSent = sentTransfers.filter(
    (t) => t.status === 'PENDING' && new Date() < new Date(t.expiresAt)
  );

  const selectedHomeHasPendingTransfer = selectedHome
    ? pendingTransferHomeIds.has(selectedHome.id)
    : false;

  const handleTransferComplete = () => {
    setTransferModalOpen(false);
    // Refresh transfers
    fetch('/api/transfers')
      .then(res => res.json())
      .then(data => {
        setSentTransfers(data.sent || []);
        setReceivedTransfers(data.received || []);
        const pendingIds = new Set<string>();
        (data.sent || []).forEach((t: Transfer) => {
          if (t.status === 'PENDING' && new Date() < new Date(t.expiresAt)) {
            pendingIds.add(t.homeId);
          }
        });
        setPendingTransferHomeIds(pendingIds);
      })
      .catch(console.error);
  };

  const handleCancelTransfer = async (transferId: string) => {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;

    try {
      const res = await fetch(`/api/transfers/${transferId}`, { method: 'DELETE' });
      if (res.ok) {
        handleTransferComplete();
      }
    } catch (err) {
      console.error('Failed to cancel transfer:', err);
    }
  };

  return (
    <section className={`${glass} overflow-visible relative`}>
      <h2 className={`mb-4 text-lg font-medium ${heading}`}>
        Home Transfers
      </h2>

      <p className="text-white/70 text-sm mb-4">
        Transfer ownership of your homes to another person, or accept transfers sent to you.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending Received Transfers */}
          {pendingReceived.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Inbox className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 font-medium text-sm">
                  {pendingReceived.length} transfer{pendingReceived.length > 1 ? 's' : ''} awaiting your response
                </span>
              </div>
              <div className="space-y-2">
                {pendingReceived.map((transfer) => (
                  <div
                    key={transfer.id}
                    onClick={() => router.push(`/transfers/accept?token=${transfer.token}`)}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {formatAddress(transfer.home)}
                      </p>
                      <p className="text-white/50 text-xs truncate">
                        From: {transfer.fromUser.name || transfer.fromUser.email}
                      </p>
                    </div>
                    <span className="text-blue-400 text-xs">View →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Sent Transfers */}
          {pendingSent.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-medium text-sm">
                  {pendingSent.length} pending transfer{pendingSent.length > 1 ? 's' : ''} awaiting response
                </span>
              </div>
              <div className="space-y-2">
                {pendingSent.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/20 border border-white/10"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {formatAddress(transfer.home)}
                      </p>
                      <p className="text-white/50 text-xs truncate">
                        To: {transfer.recipientEmail}
                      </p>
                      <p className="text-white/40 text-xs">
                        Expires {new Date(transfer.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelTransfer(transfer.id)}
                      className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transfer a Home */}
          {homes.length > 0 && (
            <div className="pt-2">
              <p className="text-white/70 text-sm mb-3">Transfer a home:</p>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Home Picker Dropdown */}
                <div className="relative flex-1">
                  <button
                    ref={pickerButtonRef}
                    type="button"
                    onClick={() => {
                      if (pickerButtonRef.current) {
                        setPickerRect(pickerButtonRef.current.getBoundingClientRect());
                      }
                      setHomePickerOpen(!homePickerOpen);
                    }}
                    className="w-full flex items-center justify-between gap-2 rounded-lg bg-black/30 text-white border border-white/20 p-3 hover:border-white/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Home className="w-4 h-4 text-white/50 flex-shrink-0" />
                      <span className="truncate text-sm">
                        {selectedHome ? formatAddress(selectedHome) : 'Select a home'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${homePickerOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Transfer Button */}
                <button
                  onClick={() => setTransferModalOpen(true)}
                  disabled={!selectedHome || selectedHomeHasPendingTransfer}
                  className={`${ctaPrimary} flex items-center justify-center gap-2 whitespace-nowrap ${
                    (!selectedHome || selectedHomeHasPendingTransfer) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {selectedHomeHasPendingTransfer ? 'Transfer Pending' : 'Transfer'}
                </button>
              </div>
            </div>
          )}

          {homes.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
              <p className="text-white/50 text-sm">
                No homes to transfer
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transfer Modal - rendered via portal to escape stacking context */}
      {mounted && selectedHome && createPortal(
        <TransferHomeModal
          isOpen={transferModalOpen}
          onClose={handleTransferComplete}
          home={{
            id: selectedHome.id,
            address: selectedHome.address,
            addressLine2: selectedHome.addressLine2,
            city: selectedHome.city || '',
            state: selectedHome.state || '',
            zip: selectedHome.zip || '',
            photos: selectedHome.photos,
          }}
        />,
        document.body
      )}

      {/* Home Picker Dropdown - rendered via portal */}
      {mounted && homePickerOpen && pickerRect && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setHomePickerOpen(false)}
          />
          <div
            className="fixed z-[101] rounded-lg border border-white/15 bg-black/95 backdrop-blur-xl shadow-xl overflow-hidden"
            style={{
              top: pickerRect.bottom + 4,
              left: pickerRect.left,
              width: pickerRect.width,
            }}
          >
            <div className="max-h-48 overflow-y-auto">
              {homes.map((home) => {
                const hasPending = pendingTransferHomeIds.has(home.id);
                return (
                  <button
                    key={home.id}
                    type="button"
                    onClick={() => {
                      setSelectedHome(home);
                      setHomePickerOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                      selectedHome?.id === home.id
                        ? 'bg-white/15 text-white'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">{formatAddress(home)}</span>
                    {hasPending && (
                      <span className="text-xs text-amber-400 flex-shrink-0 ml-2">
                        Pending
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </section>
  );
}