// =============================================================================
// components/transfers/TransferHomeButton.tsx
// =============================================================================
// Button to open the transfer modal from home settings

'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransferHomeModal } from './TransferHomeModal';

// Glass styling - adjust to match your existing glass utilities
const glassTight = "bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl";

interface TransferHomeButtonProps {
  home: {
    id: string;
    address: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    zip: string;
    photos?: string[];
  };
  hasPendingTransfer?: boolean;
}

export function TransferHomeButton({ home, hasPendingTransfer }: TransferHomeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (hasPendingTransfer) {
    return (
      <button
        disabled
        className={cn(
          glassTight,
          "w-full flex items-center gap-3 px-4 py-3 text-left opacity-50 cursor-not-allowed"
        )}
      >
        <Send className="w-5 h-5 text-neutral-500" />
        <div>
          <p className="text-neutral-400 font-medium">Transfer Ownership</p>
          <p className="text-xs text-neutral-500">A transfer is already pending</p>
        </div>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          glassTight,
          "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors group"
        )}
      >
        <Send className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
        <div>
          <p className="text-white font-medium group-hover:text-blue-100 transition-colors">
            Transfer Ownership
          </p>
          <p className="text-xs text-neutral-400">
            Transfer this home to another person
          </p>
        </div>
      </button>

      <TransferHomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        home={home}
      />
    </>
  );
}