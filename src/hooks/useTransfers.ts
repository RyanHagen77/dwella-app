// =============================================================================
// hooks/useTransfers.ts
// =============================================================================
// React hook for managing transfer

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TransferWithDetails } from '@/lib/transfer/types';

interface UseTransfersReturn {
  sentTransfers: TransferWithDetails[];
  receivedTransfers: TransferWithDetails[];
  pendingCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTransfers(): UseTransfersReturn {
  const [sentTransfers, setSentTransfers] = useState<TransferWithDetails[]>([]);
  const [receivedTransfers, setReceivedTransfers] = useState<TransferWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transfer');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transfer');
      }

      setSentTransfers(data.sent || []);
      setReceivedTransfers(data.received || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const pendingReceived = receivedTransfers.filter((t) => t.status === 'PENDING');

  return {
    sentTransfers,
    receivedTransfers,
    pendingCount: pendingReceived.length,
    isLoading,
    error,
    refresh: fetchTransfers,
  };
}