// =============================================================================
// lib/transfer/types.ts
// =============================================================================

import { z } from 'zod';

// Validation schema for initiating a transfer
export const initiateTransferSchema = z.object({
  homeId: z.string().min(1, 'Home ID is required'),
  recipientEmail: z.string().email('Valid email is required'),
  message: z.string().max(500, 'Message must be under 500 characters').optional(),
  notifyContractors: z.boolean().default(true),
  transferMessages: z.boolean().default(true),
  expiresInDays: z.number().min(1).max(90).default(30),
});

export type InitiateTransferInput = z.infer<typeof initiateTransferSchema>;

// Validation schema for accepting a transfer
export const acceptTransferSchema = z.object({
  token: z.string().min(1, 'Transfer token is required'),
});

export type AcceptTransferInput = z.infer<typeof acceptTransferSchema>;

// Transfer with relations for UI display
export interface TransferWithDetails {
  id: string;
  homeId: string;
  home: {
    id: string;
    address: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    zip: string;
    photos: string[];
  };
  fromUser: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
  toUser?: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  } | null;
  recipientEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
  message?: string | null;
  notifyContractors: boolean;
  transferMessages: boolean;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date | null;
  token: string;
}

// API Response types
export interface TransferResponse {
  success: boolean;
  transfer?: TransferWithDetails;
  error?: string;
}

export interface TransfersListResponse {
  success: boolean;
  sent: TransferWithDetails[];
  received: TransferWithDetails[];
  error?: string;
}

// Transfer statistics for dashboard
export interface TransferStats {
  pendingSent: number;
  pendingReceived: number;
  completedTransfers: number;
}