// =============================================================================
// app/api/transfer/decline/route.ts
// =============================================================================
// POST: Decline a transfer invitation

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { declineTransfer } from '@/lib/transfer/transfer-service';

// POST /api/transfer/decline - Decline a transfer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Please log in to decline this transfer' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const transfer = await declineTransfer(session.user.id, token);

    return NextResponse.json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error('Error declining transfer:', error);
    const message = error instanceof Error ? error.message : 'Failed to decline transfer';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}