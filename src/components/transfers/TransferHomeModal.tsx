// =============================================================================
// components/transfers/TransferHomeModal.tsx
// =============================================================================
// Modal for initiating a home ownership transfer

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Home, Send, AlertTriangle, Loader2, Check } from 'lucide-react';
import { glass, ctaPrimary, ctaGhost, heading } from '@/lib/glass';

interface TransferHomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  home: {
    id: string;
    address: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    zip: string;
    photos?: string[];
  };
}

export function TransferHomeModal({ isOpen, onClose, home }: TransferHomeModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [notifyContractors, setNotifyContractors] = useState(true);
  const [transferMessages, setTransferMessages] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState(30);

  if (!isOpen) return null;

  const homeDisplayName = `${home.address}, ${home.city}`;
  const fullAddress = home.addressLine2
    ? `${home.address}, ${home.addressLine2}, ${home.city}, ${home.state} ${home.zip}`
    : `${home.address}, ${home.city}, ${home.state} ${home.zip}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeId: home.id,
          recipientEmail,
          message: message || undefined,
          notifyContractors,
          transferMessages,
          expiresInDays,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate transfer');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      router.refresh();
    }
    setStep('form');
    setRecipientEmail('');
    setMessage('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`${glass} relative z-[201] w-full max-w-lg p-0 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Home className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${heading}`}>Transfer Home Ownership</h2>
              <p className="text-sm text-white/60">{homeDisplayName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Form Step */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Home Preview */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-medium">{homeDisplayName}</p>
                <p className="text-white/50 text-sm">{fullAddress}</p>
              </div>

              {/* Recipient Email */}
              <label className="block">
                <span className="text-white/70 text-sm font-medium mb-2 block">
                  Recipient&apos;s Email Address
                </span>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="newowner@example.com"
                  className="w-full rounded-lg bg-black/30 text-white placeholder:text-white/40 border border-white/20 p-3 focus:border-white/40 focus:outline-none transition-colors"
                  required
                />
                <p className="text-white/50 text-xs mt-1">
                  They&apos;ll receive an email invitation to accept the transfer
                </p>
              </label>

              {/* Personal Message */}
              <label className="block">
                <span className="text-white/70 text-sm font-medium mb-2 block">
                  Personal Message <span className="text-white/40">(optional)</span>
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a note for the recipient..."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg bg-black/30 text-white placeholder:text-white/40 border border-white/20 p-3 focus:border-white/40 focus:outline-none transition-colors resize-none"
                />
              </label>

              {/* Options */}
              <div className="space-y-3">
                <p className="text-white/70 text-sm font-medium">Transfer Options</p>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyContractors}
                    onChange={(e) => setNotifyContractors(e.target.checked)}
                    className="mt-1 rounded border-white/30 bg-black/30 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                  />
                  <div>
                    <p className="text-sm text-white">Notify connected contractors</p>
                    <p className="text-xs text-white/50">
                      Contractors will be notified of the ownership change
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transferMessages}
                    onChange={(e) => setTransferMessages(e.target.checked)}
                    className="mt-1 rounded border-white/30 bg-black/30 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                  />
                  <div>
                    <p className="text-sm text-white">Include message history</p>
                    <p className="text-xs text-white/50">
                      New owner can see contractor conversations
                    </p>
                  </div>
                </label>
              </div>

              {/* Expiration */}
              <label className="block">
                <span className="text-white/70 text-sm font-medium mb-2 block">
                  Invitation Expires In
                </span>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full rounded-lg bg-black/30 text-white border border-white/20 p-3 focus:border-white/40 focus:outline-none transition-colors"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </label>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button type="submit" className={`${ctaPrimary} w-full`}>
                Continue
              </button>
            </form>
          )}

          {/* Confirmation Step */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/15 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Confirm Transfer</p>
                  <p className="text-sm text-amber-200/80 mt-1">
                    This action will send an invitation to <strong>{recipientEmail}</strong>.
                    Once they accept, ownership of this home will be permanently transferred.
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Home</span>
                  <span className="text-white">{homeDisplayName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Recipient</span>
                  <span className="text-white">{recipientEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Notify Contractors</span>
                  <span className="text-white">{notifyContractors ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Expires</span>
                  <span className="text-white">{expiresInDays} days</span>
                </div>
              </div>

              <p className="text-white/50 text-sm text-center">
                What will be transferred: warranties, records, documents, photos,
                maintenance history, and contractor connections.
              </p>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  disabled={isLoading}
                  className={`${ctaGhost} flex-1`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`${ctaPrimary} flex-1 flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="space-y-5 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
                <Check className="w-8 h-8 text-green-400" />
              </div>

              <div>
                <h3 className={`text-xl font-semibold mb-2 ${heading}`}>Invitation Sent!</h3>
                <p className="text-white/60">
                  We&apos;ve sent a transfer invitation to <strong className="text-white">{recipientEmail}</strong>.
                  They&apos;ll receive an email with instructions to accept the transfer.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-left space-y-2">
                <p className="text-sm text-white font-medium">What happens next?</p>
                <ul className="text-sm text-white/60 space-y-1">
                  <li>• The recipient will receive an email invitation</li>
                  <li>• They&apos;ll need to log in or create an account to accept</li>
                  <li>• Once accepted, ownership transfers immediately</li>
                  <li>• You can cancel the transfer anytime before it&apos;s accepted</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className={`${ctaPrimary} w-full`}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}