// =============================================================================
// app/api/transfers/accept/route.ts
// =============================================================================
// GET: Get transfer details by token (for accept page)
// POST: Accept a transfer

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { acceptTransfer, getTransferByToken } from '@/lib/transfers/transfer-service';
import { acceptTransferSchema } from '@/lib/transfers/types';

// GET /api/transfers/accept?token=xxx - Get transfer details by token
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const transfer = await getTransferByToken(token);

    if (!transfer) {
      return NextResponse.json(
        { success: false, error: 'Transfer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transfer' },
      { status: 500 }
    );
  }
}

// POST /api/transfers/accept - Accept a transfer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Please log in to accept this transfer' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = acceptTransferSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.issues[0]?.message || 'Invalid input'
        },
        { status: 400 }
      );
    }

    const transfer = await acceptTransfer(session.user.id, validationResult.data.token);

    return NextResponse.json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error('Error accepting transfer:', error);
    const message = error instanceof Error ? error.message : 'Failed to accept transfer';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}