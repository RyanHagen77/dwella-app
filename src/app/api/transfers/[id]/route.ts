// =============================================================================
// app/api/transfers/[id]/route.ts
// =============================================================================
// GET: Get transfer details by ID
// DELETE: Cancel a pending transfer

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig} from '@/lib/auth';
import { cancelTransfer } from '@/lib/transfers/transfer-service';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/transfers/[id] - Get transfer details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const transfer = await prisma.homeTransfer.findUnique({
      where: { id },
      include: {
        home: {
          select: {
            id: true,
            address: true,
            addressLine2: true,
            city: true,
            state: true,
            zip: true,
            photos: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { success: false, error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Check if user is allowed to view this transfer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const isOwner = transfer.fromUserId === session.user.id;
    const isRecipient = user?.email?.toLowerCase() === transfer.recipientEmail.toLowerCase();

    if (!isOwner && !isRecipient) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this transfer' },
        { status: 403 }
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

// DELETE /api/transfers/[id] - Cancel a pending transfer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const transfer = await cancelTransfer(session.user.id, id);

    return NextResponse.json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel transfer';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}