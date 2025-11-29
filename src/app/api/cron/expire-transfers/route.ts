// =============================================================================
// app/api/cron/expire-transfer/route.ts
// =============================================================================
// Cron job to expire old pending transfer
// Schedule: Every hour (configured in vercel.json)

import { NextRequest, NextResponse } from 'next/server';
import { expireOldTransfers } from '@/lib/transfer/transfer-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, require the secret
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('[Cron] Unauthorized request to expire-transfer');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[Cron] Running expire-transfer job...');

    const expiredCount = await expireOldTransfers();

    console.log(`[Cron] Expired ${expiredCount} transfers`);

    return NextResponse.json({
      success: true,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error expiring transfer:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}