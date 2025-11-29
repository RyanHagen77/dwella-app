// =============================================================================
// app/api/transfer/route.ts
// =============================================================================
// GET: List all transfer for current user
// POST: Create a new transfer

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { initiateTransfer, getUserTransfers } from '@/lib/transfers/transfer-service';
import { initiateTransferSchema } from '@/lib/transfers/types';

// GET /api/transfer - Get all transfer for current user
export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const transfers = await getUserTransfers(session.user.id);

    return NextResponse.json({
      success: true,
      ...transfers,
    });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transfer' },
      { status: 500 }
    );
  }
}

// POST /api/transfer - Initiate a new transfer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = initiateTransferSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.issues[0]?.message || 'Invalid input'
        },
        { status: 400 }
      );
    }

    const transfer = await initiateTransfer(session.user.id, validationResult.data);

    return NextResponse.json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error('Error initiating transfer:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate transfer';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}