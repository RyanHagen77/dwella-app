/* prisma/seed-qa.ts */
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * QA Seed (re-runnable)
 *
 * Safety:
 *   - Requires QA_SEED=1
 * Optional:
 *   - QA_SEED_RESET=1 to hard-delete the seeded graph first
 *
 * Config:
 *   - TEST_EMAIL_DOMAIN=test.yourdomain.com   (recommended)
 */

const SEED_TAG = "QA_SEED_V1";

const TEST_DOMAIN = process.env.TEST_EMAIL_DOMAIN || "test.yourdomain.com";

// Canonical test emails (matches your setup)
const EMAILS = {
  hoPrimary: `ho.primary@${TEST_DOMAIN}`,
  hoSecondary: `ho.secondary@${TEST_DOMAIN}`,

  proContractorApproved: `pro.contractor.approved@${TEST_DOMAIN}`,
  proContractorPending: `pro.contractor.pending@${TEST_DOMAIN}`,
  proContractorRejected: `pro.contractor.rejected@${TEST_DOMAIN}`,

  authUnverified: `auth.unverified@${TEST_DOMAIN}`,

  inviteRecipient: `invite.recipient@${TEST_DOMAIN}`,
};

// Stable home identity (no unique constraint on Home)
const HOME = {
  address: "123 Seed St",
  addressLine2: "Unit 4",
  city: "Testville",
  state: "TX",
  zip: "75001",
};

function assertSafe() {
  if (process.env.QA_SEED !== "1") {
    throw new Error("Refusing to run seed. Set QA_SEED=1 to run this script.");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run seed in production.");
  }
}

async function resetIfRequested() {
  if (process.env.QA_SEED_RESET !== "1") return;

  const ho = await prisma.user.findUnique({
    where: { email: EMAILS.hoPrimary },
    select: { id: true },
  });

  const contractorApproved = await prisma.user.findUnique({
    where: { email: EMAILS.proContractorApproved },
    select: { id: true },
  });

  const home = ho
    ? await prisma.home.findFirst({
        where: {
          ownerId: ho.id,
          address: HOME.address,
          city: HOME.city,
          state: HOME.state,
          zip: HOME.zip,
        },
        select: { id: true },
      })
    : null;

  const connection =
    ho && contractorApproved && home
      ? await prisma.connection.findUnique({
          where: {
            homeownerId_contractorId_homeId: {
              homeownerId: ho.id,
              contractorId: contractorApproved.id,
              homeId: home.id,
            },
          },
          select: { id: true },
        })
      : null;

  if (connection?.id) {
    await prisma.messageRead.deleteMany({
      where: { message: { connectionId: connection.id } },
    });
    await prisma.attachment.deleteMany({
      where: { message: { connectionId: connection.id } },
    });
    await prisma.message.deleteMany({ where: { connectionId: connection.id } });
    await prisma.thread.deleteMany({ where: { connectionId: connection.id } });

    await prisma.attachment.deleteMany({
      where: { serviceRequest: { connectionId: connection.id } },
    });
    await prisma.quoteItem.deleteMany({
      where: { quote: { connectionId: connection.id } },
    });
    await prisma.quote.deleteMany({ where: { connectionId: connection.id } });
    await prisma.serviceRequest.deleteMany({ where: { connectionId: connection.id } });

    await prisma.connection.deleteMany({ where: { id: connection.id } });
  }

  if (home?.id) {
    await prisma.attachment.deleteMany({ where: { homeId: home.id } }).catch(() => null);
    await prisma.warranty.deleteMany({ where: { homeId: home.id } });
    await prisma.reminder.deleteMany({ where: { homeId: home.id } });
    await prisma.record.deleteMany({ where: { homeId: home.id } });
    await prisma.serviceSubmission.deleteMany({ where: { homeId: home.id } }).catch(() => null);
    await prisma.serviceRecord.deleteMany({ where: { homeId: home.id } });
    await prisma.invitation.deleteMany({ where: { homeId: home.id } }).catch(() => null);
    await prisma.home.deleteMany({ where: { id: home.id } });
  }

  if (contractorApproved?.id) {
    await prisma.contractorReminder.deleteMany({ where: { proId: contractorApproved.id } });
    await prisma.proProfile.deleteMany({ where: { userId: contractorApproved.id } });
  }

  await prisma.invitation
    .deleteMany({
      where: {
        OR: [
          { invitedEmail: { in: Object.values(EMAILS) } },
          { token: { startsWith: SEED_TAG } },
        ],
      },
    })
    .catch(() => null);

  console.log("✅ QA seed reset complete.");
}

async function upsertUsers() {
  const now = new Date();

  const hoPrimary = await prisma.user.upsert({
    where: { email: EMAILS.hoPrimary },
    update: {
      name: "QA Homeowner Primary",
      role: "HOMEOWNER",
      emailVerified: now,
      profileComplete: true,
    },
    create: {
      email: EMAILS.hoPrimary,
      name: "QA Homeowner Primary",
      role: "HOMEOWNER",
      emailVerified: now,
      profileComplete: true,
    },
  });

  const hoSecondary = await prisma.user.upsert({
    where: { email: EMAILS.hoSecondary },
    update: {
      name: "QA Homeowner Secondary",
      role: "HOMEOWNER",
      emailVerified: now,
      profileComplete: true,
    },
    create: {
      email: EMAILS.hoSecondary,
      name: "QA Homeowner Secondary",
      role: "HOMEOWNER",
      emailVerified: now,
      profileComplete: true,
    },
  });

  const contractorApproved = await prisma.user.upsert({
    where: { email: EMAILS.proContractorApproved },
    update: {
      name: "QA Contractor Approved",
      role: "PRO",
      proStatus: "APPROVED",
      emailVerified: now,
      profileComplete: true,
    },
    create: {
      email: EMAILS.proContractorApproved,
      name: "QA Contractor Approved",
      role: "PRO",
      proStatus: "APPROVED",
      emailVerified: now,
      profileComplete: true,
    },
  });

  const contractorPending = await prisma.user.upsert({
    where: { email: EMAILS.proContractorPending },
    update: {
      name: "QA Contractor Pending",
      role: "PRO",
      proStatus: "PENDING",
      emailVerified: now,
      profileComplete: true,
    },
    create: {
      email: EMAILS.proContractorPending,
      name: "QA Contractor Pending",
      role: "PRO",
      proStatus: "PENDING",
      emailVerified: now,
      profileComplete: true,
    },
  });

  const contractorRejected = await prisma.user.upsert({
    where: { email: EMAILS.proContractorRejected },
    update: {
      name: "QA Contractor Rejected",
      role: "PRO",
      proStatus: "REJECTED",
      emailVerified: now,
      profileComplete: true,
    },
    create: {
      email: EMAILS.proContractorRejected,
      name: "QA Contractor Rejected",
      role: "PRO",
      proStatus: "REJECTED",
      emailVerified: now,
      profileComplete: true,
    },
  });

  // Unverified account (emailVerified intentionally NULL)
  const authUnverified = await prisma.user.upsert({
    where: { email: EMAILS.authUnverified },
    update: {
      name: "QA Unverified",
      role: "HOMEOWNER",
      emailVerified: null,
      profileComplete: true,
    },
    create: {
      email: EMAILS.authUnverified,
      name: "QA Unverified",
      role: "HOMEOWNER",
      emailVerified: null,
      profileComplete: true,
    },
  });

  // ProProfile for approved contractor only
  await prisma.proProfile.upsert({
    where: { userId: contractorApproved.id },
    update: {
      type: "CONTRACTOR",
      businessName: "QA Contracting Co.",
      verified: true,
      rating: 4.9,
      phone: "5551234567",
      specialties: ["Plumbing", "Appliance"],
      serviceAreas: ["Testville"],
    },
    create: {
      userId: contractorApproved.id,
      type: "CONTRACTOR",
      businessName: "QA Contracting Co.",
      verified: true,
      rating: 4.9,
      phone: "5551234567",
      specialties: ["Plumbing", "Appliance"],
      serviceAreas: ["Testville"],
    },
  });

  return {
    hoPrimary,
    hoSecondary,
    contractorApproved,
    contractorPending,
    contractorRejected,
    authUnverified,
  };
}

async function getOrCreateHome(ownerId: string) {
  const existing = await prisma.home.findFirst({
    where: {
      ownerId,
      address: HOME.address,
      city: HOME.city,
      state: HOME.state,
      zip: HOME.zip,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.home.update({
      where: { id: existing.id },
      data: {
        addressLine2: HOME.addressLine2,
        meta: { seed: SEED_TAG },
        verificationStatus: "VERIFIED_BY_POSTCARD",
        verificationMethod: "POSTCARD",
        verifiedAt: new Date(),
        verifiedByUserId: ownerId,
      },
    });
  }

  return prisma.home.create({
    data: {
      ownerId,
      address: HOME.address,
      addressLine2: HOME.addressLine2,
      city: HOME.city,
      state: HOME.state,
      zip: HOME.zip,
      meta: { seed: SEED_TAG },
      verificationStatus: "VERIFIED_BY_POSTCARD",
      verificationMethod: "POSTCARD",
      verifiedAt: new Date(),
      verifiedByUserId: ownerId,
    },
  });
}

async function getOrCreateConnection(homeId: string, homeownerId: string, contractorId: string) {
  return prisma.connection.upsert({
    where: { homeownerId_contractorId_homeId: { homeownerId, contractorId, homeId } },
    update: {
      status: "ACTIVE",
      invitedBy: homeownerId,
      acceptedAt: new Date(),
      establishedVia: "INVITATION",
      tags: [SEED_TAG],
    },
    create: {
      homeId,
      homeownerId,
      contractorId,
      status: "ACTIVE",
      invitedBy: homeownerId,
      acceptedAt: new Date(),
      establishedVia: "INVITATION",
      tags: [SEED_TAG],
      totalSpent: new Prisma.Decimal("0"),
    },
  });
}

/** Idempotent helpers: delete previously-seeded rows (by tag) before re-creating */
async function cleanupSeededContentForConnection(connectionId: string, homeId: string, contractorId: string) {
  await prisma.messageRead.deleteMany({ where: { message: { connectionId } } });

  await prisma.attachment.deleteMany({
    where: {
      homeId,
      OR: [
        { message: { connectionId } },
        { serviceRecord: { contractorId } },
        { serviceRequest: { connectionId } },
      ],
      key: { startsWith: `${SEED_TAG}/` },
    },
  });

  await prisma.message.deleteMany({
    where: { connectionId, content: { startsWith: `[${SEED_TAG}]` } },
  });

  await prisma.thread.deleteMany({
    where: { connectionId, subject: { startsWith: `[${SEED_TAG}]` } },
  });

  await prisma.contractorReminder.deleteMany({
    where: { proId: contractorId, title: { startsWith: `[${SEED_TAG}]` } },
  });

  await prisma.reminder.deleteMany({
    where: { homeId, title: { startsWith: `[${SEED_TAG}]` } },
  });

  await prisma.warranty.deleteMany({
    where: { homeId, item: { startsWith: `[${SEED_TAG}]` } },
  });

  // Service workflow
  await prisma.quoteItem.deleteMany({
    where: { quote: { connectionId, title: { startsWith: `[${SEED_TAG}]` } } },
  });
  await prisma.quote.deleteMany({
    where: { connectionId, title: { startsWith: `[${SEED_TAG}]` } },
  });
  await prisma.serviceRequest.deleteMany({
    where: { connectionId, title: { startsWith: `[${SEED_TAG}]` } },
  });
  await prisma.serviceRecord.deleteMany({
    where: { homeId, contractorId, OR: [{ serviceType: { contains: SEED_TAG } }, { description: { contains: SEED_TAG } }] },
  });

  // Invitations (token is unique; we seed deterministic tokens)
  await prisma.invitation.deleteMany({
    where: { token: { startsWith: SEED_TAG } },
  });
}

async function seedMessages(connectionId: string, homeownerId: string, contractorId: string, homeId: string) {
  const now = Date.now();

  const m1 = await prisma.message.create({
    data: {
      connectionId,
      senderId: homeownerId,
      content: `[${SEED_TAG}] Hi! Can you look at the water heater leak?`,
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
    },
  });

  const m2 = await prisma.message.create({
    data: {
      connectionId,
      senderId: contractorId,
      content: `[${SEED_TAG}] Yep — I can come by tomorrow afternoon.`,
      createdAt: new Date(now - 90 * 60 * 1000),
    },
  });

  const m3 = await prisma.message.create({
    data: {
      connectionId,
      senderId: homeownerId,
      content: `[${SEED_TAG}] Great. Here’s a photo of the leak.`,
      createdAt: new Date(now - 10 * 60 * 1000),
    },
  });

  // Mark contractor -> homeowner message as read by homeowner (so contractor sees read state)
  await prisma.messageRead.upsert({
    where: { messageId_userId: { messageId: m2.id, userId: homeownerId } },
    update: {},
    create: { messageId: m2.id, userId: homeownerId },
  });

  // Keep m1 used so ESLint doesn't warn if you lint this file
  void m1;

  // Message attachment (so attachment UI has something)
  await prisma.attachment.create({
    data: {
      homeId,
      messageId: m3.id,
      key: `${SEED_TAG}/messages/leak.jpg`,
      url: "https://example.com/qa/leak.jpg",
      filename: "leak.jpg",
      mimeType: "image/jpeg",
      size: BigInt(245123),
      uploadedBy: homeownerId,
      visibility: "HOME",
    },
  });
}

async function seedReminders(homeId: string, homeownerId: string, contractorId: string) {
  await prisma.reminder.create({
    data: {
      homeId,
      title: `[${SEED_TAG}] Follow up with contractor`,
      dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      note: "Overdue reminder to test past-due UI.",
      createdBy: homeownerId,
    },
  });

  await prisma.reminder.create({
    data: {
      homeId,
      title: `[${SEED_TAG}] Change HVAC filter`,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      note: "Upcoming reminder to test soon UI.",
      createdBy: homeownerId,
    },
  });

  await prisma.contractorReminder.create({
    data: {
      proId: contractorId,
      title: `[${SEED_TAG}] Send estimate follow-up`,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "PENDING",
      note: "Contractor reminder (personal).",
    },
  });

  await prisma.contractorReminder.create({
    data: {
      proId: contractorId,
      title: `[${SEED_TAG}] Close out completed job`,
      dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "DONE",
      note: "Completed reminder state.",
    },
  });
}

async function seedServiceWorkflow(connectionId: string, homeId: string, homeownerId: string, contractorId: string) {
  const reqPending = await prisma.serviceRequest.create({
    data: {
      connectionId,
      homeId,
      homeownerId,
      contractorId,
      title: `[${SEED_TAG}] Fix water heater leak`,
      description: "Leak near base of tank. Please inspect and advise.",
      urgency: "NORMAL",
      status: "PENDING",
    },
  });

  const reqQuoted = await prisma.serviceRequest.create({
    data: {
      connectionId,
      homeId,
      homeownerId,
      contractorId,
      title: `[${SEED_TAG}] Replace valve`,
      description: "Replace faulty valve and verify operation.",
      urgency: "HIGH",
      status: "QUOTED",
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const quote = await prisma.quote.create({
    data: {
      connectionId,
      homeId,
      serviceRequestId: reqQuoted.id,
      title: `[${SEED_TAG}] Valve replacement quote`,
      description: "Parts + labor",
      totalAmount: new Prisma.Decimal("1200.00"),
      status: "SENT",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            item: "Valve",
            qty: new Prisma.Decimal("1"),
            unitPrice: new Prisma.Decimal("400.00"),
            total: new Prisma.Decimal("400.00"),
          },
          {
            item: "Labor",
            qty: new Prisma.Decimal("1"),
            unitPrice: new Prisma.Decimal("800.00"),
            total: new Prisma.Decimal("800.00"),
          },
        ],
      },
    },
  });

  await prisma.serviceRequest.update({
    where: { id: reqQuoted.id },
    data: { quoteId: quote.id },
  });

  const reqCompleted = await prisma.serviceRequest.create({
    data: {
      connectionId,
      homeId,
      homeownerId,
      contractorId,
      title: `[${SEED_TAG}] Completed valve replacement`,
      description: "Work completed and tested.",
      urgency: "NORMAL",
      status: "COMPLETED",
      respondedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  const srApproved = await prisma.serviceRecord.create({
    data: {
      serviceRequestId: reqCompleted.id,
      homeId,
      contractorId,
      serviceType: `Valve Replacement (${SEED_TAG})`,
      serviceDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      description: `Replaced valve and verified operation. (${SEED_TAG})`,
      cost: new Prisma.Decimal("1200.00"),
      status: "APPROVED",
      isVerified: true,
      approvedBy: homeownerId,
      approvedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      verifiedBy: homeownerId,
      verifiedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      warrantyIncluded: true,
      warrantyLength: "12 months",
      warrantyDetails: "Covers workmanship and parts for 12 months.",
    },
  });

  const srPending = await prisma.serviceRecord.create({
    data: {
      homeId,
      contractorId,
      serviceType: `Water Heater Inspection (${SEED_TAG})`,
      serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      description: `Inspected unit; recommended replacement of valve. (${SEED_TAG})`,
      cost: new Prisma.Decimal("250.00"),
      status: "DOCUMENTED_UNVERIFIED",
      isVerified: false,
      warrantyIncluded: false,
    },
  });

  await prisma.attachment.create({
    data: {
      homeId,
      serviceRecordId: srApproved.id,
      key: `${SEED_TAG}/service-records/invoice.pdf`,
      url: "https://example.com/qa/invoice.pdf",
      filename: "invoice.pdf",
      mimeType: "application/pdf",
      size: BigInt(912345),
      uploadedBy: contractorId,
      visibility: "HOME",
    },
  });

  void reqPending;
  void srPending;

  return { srApproved };
}

async function seedWarranties(homeId: string, homeownerId: string, contractorId: string, srApprovedId: string) {
  await prisma.warranty.create({
    data: {
      homeId,
      item: `[${SEED_TAG}] Water Heater Coverage`,
      provider: "QA Warranty Co.",
      policyNo: "QA-PENDING-001",
      purchasedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: "PENDING",
      createdBy: contractorId,
      serviceRecordId: srApprovedId,
      note: "Pending acceptance warranty.",
    },
  });

  await prisma.warranty.create({
    data: {
      homeId,
      item: `[${SEED_TAG}] Valve Replacement Warranty`,
      provider: "QA Warranty Co.",
      policyNo: "QA-ACTIVE-001",
      purchasedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      acceptedBy: homeownerId,
      acceptedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      createdBy: contractorId,
      serviceRecordId: srApprovedId,
      note: "Accepted warranty (active).",
    },
  });

  await prisma.warranty.create({
    data: {
      homeId,
      item: `[${SEED_TAG}] Old Heater Coverage`,
      provider: "QA Warranty Co.",
      policyNo: "QA-REJECT-001",
      purchasedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: "REJECTED",
      createdBy: contractorId,
      serviceRecordId: null,
      note: "Rejected warranty state.",
    },
  });
}

async function seedInvitations(homeId: string, homeownerId: string, contractorId: string) {
  // Rerunnable invitations via upsert on unique token
  await prisma.invitation.upsert({
    where: { token: `${SEED_TAG}_INV_PENDING_HOMEOWNER` },
    update: {
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      message: "Join this home to view service details.",
    },
    create: {
      invitedBy: contractorId,
      invitedEmail: EMAILS.inviteRecipient,
      invitedName: "Invite Recipient",
      homeId,
      role: "HOMEOWNER",
      status: "PENDING",
      token: `${SEED_TAG}_INV_PENDING_HOMEOWNER`,
      message: "Join this home to view service details.",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.invitation.upsert({
    where: { token: `${SEED_TAG}_INV_EXPIRED_PRO` },
    update: {
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      message: "Expired invitation state.",
    },
    create: {
      invitedBy: homeownerId,
      invitedEmail: EMAILS.proContractorApproved,
      invitedName: "Invited Contractor",
      homeId,
      role: "PRO",
      status: "EXPIRED",
      token: `${SEED_TAG}_INV_EXPIRED_PRO`,
      message: "Expired invitation state.",
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });
}

async function seedThread(connectionId: string, homeId: string) {
  // Thread has no unique; delete+create is fine because we only seed one
  await prisma.thread.create({
    data: {
      connectionId,
      homeId,
      subject: `[${SEED_TAG}] Water heater discussion thread`,
      status: "ACTIVE",
    },
  });
}

async function main() {
  assertSafe();
  await resetIfRequested();

  const users = await upsertUsers();
  const home = await getOrCreateHome(users.hoPrimary.id);
  const connection = await getOrCreateConnection(home.id, users.hoPrimary.id, users.contractorApproved.id);

  // Make it rerunnable without needing QA_SEED_RESET=1
  await cleanupSeededContentForConnection(connection.id, home.id, users.contractorApproved.id);

  await seedMessages(connection.id, users.hoPrimary.id, users.contractorApproved.id, home.id);
  await seedReminders(home.id, users.hoPrimary.id, users.contractorApproved.id);
  await seedThread(connection.id, home.id);

  const { srApproved } = await seedServiceWorkflow(connection.id, home.id, users.hoPrimary.id, users.contractorApproved.id);
  await seedWarranties(home.id, users.hoPrimary.id, users.contractorApproved.id, srApproved.id);
  await seedInvitations(home.id, users.hoPrimary.id, users.contractorApproved.id);

  console.log("✅ QA seed complete.");
  console.log("TEST_EMAIL_DOMAIN:", TEST_DOMAIN);
  console.log("Homeowner Primary:", EMAILS.hoPrimary);
  console.log("Contractor Approved:", EMAILS.proContractorApproved);
  console.log("Home:", `${HOME.address}, ${HOME.city}, ${HOME.state} ${HOME.zip}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });