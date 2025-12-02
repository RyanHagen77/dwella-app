// =============================================================================
// lib/transfer/transfer-service.ts
// =============================================================================

import { prisma } from '@/lib/prisma';
import { TransferStatus } from '@prisma/client';
import { sendTransferInviteEmail, sendTransferAcceptedEmail, sendTransferDeclinedEmail, sendTransferNotificationToContractors, sendTransferCancelledEmail } from './transfer-emails';
import type { InitiateTransferInput, TransferWithDetails } from './types';

// Include relations for transfer queries
const transferInclude = {
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
};

// Helper to format stats display name
function getHomeDisplayName(home: { address: string; city: string; state: string }) {
  return `${home.address}, ${home.city}`;
}

function getHomeFullAddress(home: { address: string; addressLine2?: string | null; city: string; state: string; zip: string }) {
  const line1 = home.addressLine2 ? `${home.address}, ${home.addressLine2}` : home.address;
  return `${line1}, ${home.city}, ${home.state} ${home.zip}`;
}

/**
 * Initiate a stats ownership transfer
 */
export async function initiateTransfer(
  userId: string,
  input: InitiateTransferInput
): Promise<TransferWithDetails> {
  const { homeId, recipientEmail, message, notifyContractors, transferMessages, expiresInDays } = input;

  // Verify the user owns this stats
  const home = await prisma.home.findFirst({
    where: {
      id: homeId,
      ownerId: userId,
    },
  });

  if (!home) {
    throw new Error('Home not found or you do not own this stats');
  }

  // Check for existing pending transfer for this stats
  const existingTransfer = await prisma.homeTransfer.findFirst({
    where: {
      homeId,
      status: TransferStatus.PENDING,
    },
  });

  if (existingTransfer) {
    throw new Error('There is already a pending transfer for this stats. Please cancel it first.');
  }

  // Check if recipient email is the same as owner
  const owner = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (owner?.email?.toLowerCase() === recipientEmail.toLowerCase()) {
    throw new Error('You cannot transfer a stats to yourself');
  }

  // Check if recipient already has an account
  const existingRecipient = await prisma.user.findUnique({
    where: { email: recipientEmail.toLowerCase() },
    select: { id: true },
  });

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Create the transfer request
  const transfer = await prisma.homeTransfer.create({
    data: {
      homeId,
      fromUserId: userId,
      toUserId: existingRecipient?.id || null,
      recipientEmail: recipientEmail.toLowerCase(),
      message,
      notifyContractors,
      transferMessages,
      expiresAt,
      status: TransferStatus.PENDING,
    },
    include: transferInclude,
  });

  // Send invitation email
  await sendTransferInviteEmail({
    recipientEmail: transfer.recipientEmail,
    senderName: transfer.fromUser.name || transfer.fromUser.email,
    homeName: getHomeDisplayName(transfer.home),
    homeAddress: getHomeFullAddress(transfer.home),
    message: transfer.message || undefined,
    token: transfer.token,
    expiresAt: transfer.expiresAt,
    hasAccount: !!existingRecipient,
  });

  return transfer as TransferWithDetails;
}

/**
 * Accept a stats transfer
 */
export async function acceptTransfer(
  userId: string,
  token: string
): Promise<TransferWithDetails> {
  // Find the transfer by token
  const transfer = await prisma.homeTransfer.findUnique({
    where: { token },
    include: {
      ...transferInclude,
      home: {
        include: {
          connections: {
            where: { status: 'ACTIVE' },
            include: {
              contractor: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  proProfile: {
                    select: {
                      businessName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  // Verify the accepting user
  const acceptingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!acceptingUser) {
    throw new Error('User not found');
  }

  // Verify email matches (case-insensitive)
  if (acceptingUser.email?.toLowerCase() !== transfer.recipientEmail.toLowerCase()) {
    throw new Error('This transfer was sent to a different email address');
  }

  // Check transfer status
  if (transfer.status !== TransferStatus.PENDING) {
    throw new Error(`This transfer has already been ${transfer.status.toLowerCase()}`);
  }

  // Check expiration
  if (new Date() > transfer.expiresAt) {
    // Mark as expired
    await prisma.homeTransfer.update({
      where: { id: transfer.id },
      data: {
        status: TransferStatus.EXPIRED,
        completedAt: new Date(),
      },
    });
    throw new Error('This transfer has expired');
  }

  // Perform the transfer in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update the stats ownership
    await tx.home.update({
      where: { id: transfer.homeId },
      data: {
        ownerId: userId,
        previousOwnerId: transfer.fromUserId,
        transferredAt: new Date(),
      },
    });

    // 2. Update the transfer record
    const updatedTransfer = await tx.homeTransfer.update({
      where: { id: transfer.id },
      data: {
        status: TransferStatus.ACCEPTED,
        toUserId: userId,
        completedAt: new Date(),
      },
      include: transferInclude,
    });

    // 3. End ALL active HomeOwnership records for the previous owner on this stats
    await tx.homeOwnership.updateMany({
      where: {
        homeId: transfer.homeId,
        userId: transfer.fromUserId,
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
      },
    });

    // 4. Create new ownership record for the new owner
    await tx.homeOwnership.create({
      data: {
        homeId: transfer.homeId,
        userId: userId,
        startedAt: new Date(),
      },
    });

    // 5. Remove any HomeAccess records for the old owner (they no longer need shared access to their old stats)
    await tx.homeAccess.deleteMany({
      where: {
        homeId: transfer.homeId,
        userId: transfer.fromUserId,
      },
    });

    // 6. Transfer all connections to the new owner
    // This transfer message history, threads, quotes, and job requests to the new owner
    await tx.connection.updateMany({
      where: {
        homeId: transfer.homeId,
        homeownerId: transfer.fromUserId,
      },
      data: {
        homeownerId: userId,
      },
    });

    // 7. Handle message history based on transferMessages preference
    if (!transfer.transferMessages) {
      // Get all connection IDs for this stats
      const connections = await tx.connection.findMany({
        where: { homeId: transfer.homeId },
        select: { id: true },
      });
      const connectionIds = connections.map(c => c.id);

      if (connectionIds.length > 0) {
        // Delete all messages for these connections
        await tx.message.deleteMany({
          where: {
            connectionId: { in: connectionIds },
          },
        });

        // Delete all threads for these connections
        await tx.thread.deleteMany({
          where: {
            connectionId: { in: connectionIds },
          },
        });
      }
    }

    // 8. Transfer all job requests to the new owner
    await tx.serviceRequest.updateMany({
      where: {
        homeId: transfer.homeId,
        homeownerId: transfer.fromUserId,
      },
      data: {
        homeownerId: userId,
      },
    });

    // 9. Clear lastHomeId for the old owner if it points to this stats
    await tx.user.updateMany({
      where: {
        id: transfer.fromUserId,
        lastHomeId: transfer.homeId,
      },
      data: {
        lastHomeId: null,
      },
    });

    // 10. Set lastHomeId for the new owner to this stats
    await tx.user.update({
      where: { id: userId },
      data: { lastHomeId: transfer.homeId },
    });

    // 11. Handle contractor connections based on preference
    // For now, we keep all connections active - new owner inherits them
    // The new owner can disconnect contractors themselves if desired

    return updatedTransfer;
  });

  // Send confirmation emails
  await sendTransferAcceptedEmail({
    previousOwnerEmail: transfer.fromUser.email,
    previousOwnerName: transfer.fromUser.name || undefined,
    newOwnerEmail: acceptingUser.email!,
    newOwnerName: acceptingUser.name || undefined,
    homeName: getHomeDisplayName(transfer.home),
    homeAddress: getHomeFullAddress(transfer.home),
  });

  // Notify contractors if enabled
  if (transfer.notifyContractors && transfer.home.connections) {
    const contractorsToNotify = transfer.home.connections
      .filter((c) => c.contractor)
      .map((c) => ({
        email: c.contractor!.email,
        businessName: c.contractor!.proProfile?.businessName || c.contractor!.name || 'Contractor',
      }));

    if (contractorsToNotify.length > 0) {
      await sendTransferNotificationToContractors({
        contractors: contractorsToNotify,
        homeName: getHomeDisplayName(transfer.home),
        homeAddress: getHomeFullAddress(transfer.home),
        newOwnerName: acceptingUser.name || 'The new owner',
      });
    }
  }

  return result as TransferWithDetails;
}

/**
 * Decline a stats transfer
 */
export async function declineTransfer(
  userId: string,
  token: string
): Promise<TransferWithDetails> {
  const transfer = await prisma.homeTransfer.findUnique({
    where: { token },
    include: transferInclude,
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  // Verify the declining user
  const decliningUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (decliningUser?.email?.toLowerCase() !== transfer.recipientEmail.toLowerCase()) {
    throw new Error('This transfer was sent to a different email address');
  }

  if (transfer.status !== TransferStatus.PENDING) {
    throw new Error(`This transfer has already been ${transfer.status.toLowerCase()}`);
  }

  const result = await prisma.homeTransfer.update({
    where: { id: transfer.id },
    data: {
      status: TransferStatus.DECLINED,
      toUserId: userId,
      completedAt: new Date(),
    },
    include: transferInclude,
  });

  // Send email to original owner about declined transfer
  await sendTransferDeclinedEmail({
    previousOwnerEmail: transfer.fromUser.email,
    previousOwnerName: transfer.fromUser.name || undefined,
    recipientEmail: transfer.recipientEmail,
    homeName: getHomeDisplayName(transfer.home),
    homeAddress: getHomeFullAddress(transfer.home),
  });

  return result as TransferWithDetails;
}

/**
 * Cancel a pending transfer (by original owner)
 */
export async function cancelTransfer(
  userId: string,
  transferId: string
): Promise<TransferWithDetails> {
  const transfer = await prisma.homeTransfer.findUnique({
    where: { id: transferId },
    include: transferInclude,
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  if (transfer.fromUserId !== userId) {
    throw new Error('You can only cancel transfer you initiated');
  }

  if (transfer.status !== TransferStatus.PENDING) {
    throw new Error(`This transfer has already been ${transfer.status.toLowerCase()}`);
  }

  const result = await prisma.homeTransfer.update({
    where: { id: transfer.id },
    data: {
      status: TransferStatus.CANCELLED,
      completedAt: new Date(),
    },
    include: transferInclude,
  });

  // Send email to recipient about cancelled transfer
  await sendTransferCancelledEmail({
    recipientEmail: transfer.recipientEmail,
    senderName: transfer.fromUser.name || transfer.fromUser.email,
    homeName: getHomeDisplayName(transfer.home),
    homeAddress: getHomeFullAddress(transfer.home),
  });

  return result as TransferWithDetails;
}

/**
 * Get transfer by token (for accept/decline pages)
 */
export async function getTransferByToken(token: string): Promise<TransferWithDetails | null> {
  const transfer = await prisma.homeTransfer.findUnique({
    where: { token },
    include: transferInclude,
  });

  if (!transfer) {
    return null;
  }

  // Check if expired and update status if needed
  if (transfer.status === TransferStatus.PENDING && new Date() > transfer.expiresAt) {
    const updated = await prisma.homeTransfer.update({
      where: { id: transfer.id },
      data: {
        status: TransferStatus.EXPIRED,
        completedAt: new Date(),
      },
      include: transferInclude,
    });
    return updated as TransferWithDetails;
  }

  return transfer as TransferWithDetails;
}

/**
 * Get all transfer for a user (sent and received)
 */
export async function getUserTransfers(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    throw new Error('User not found');
  }

  const [sent, received] = await Promise.all([
    // Transfers sent by this user
    prisma.homeTransfer.findMany({
      where: { fromUserId: userId },
      include: transferInclude,
      orderBy: { createdAt: 'desc' },
    }),
    // Transfers received by this user (by email match)
    prisma.homeTransfer.findMany({
      where: { recipientEmail: user.email.toLowerCase() },
      include: transferInclude,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    sent: sent as TransferWithDetails[],
    received: received as TransferWithDetails[],
  };
}

/**
 * Get pending transfer for a stats
 */
export async function getHomePendingTransfer(homeId: string, userId: string) {
  const home = await prisma.home.findFirst({
    where: {
      id: homeId,
      ownerId: userId,
    },
  });

  if (!home) {
    return null;
  }

  const transfer = await prisma.homeTransfer.findFirst({
    where: {
      homeId,
      status: TransferStatus.PENDING,
    },
    include: transferInclude,
  });

  return transfer as TransferWithDetails | null;
}

/**
 * Expire old pending transfer (run as a cron job)
 */
export async function expireOldTransfers(): Promise<number> {
  const result = await prisma.homeTransfer.updateMany({
    where: {
      status: TransferStatus.PENDING,
      expiresAt: { lt: new Date() },
    },
    data: {
      status: TransferStatus.EXPIRED,
      completedAt: new Date(),
    },
  });

  return result.count;
}