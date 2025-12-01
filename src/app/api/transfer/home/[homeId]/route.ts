// =============================================================================
// app/api/transfer/stats/[homeId]/route.ts
// =============================================================================
// GET: Get pending transfer for a specific stats (if any)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { getHomePendingTransfer } from '@/lib/transfer/transfer-service';

interface RouteParams {
  params: Promise<{ homeId: string }>;
}

// GET /api/transfer/stats/[homeId] - Get pending transfer for a specific stats
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { homeId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const transfer = await getHomePendingTransfer(homeId, session.user.id);

    return NextResponse.json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error('Error fetching stats transfer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transfer' },
      { status: 500 }
    );
  }
}