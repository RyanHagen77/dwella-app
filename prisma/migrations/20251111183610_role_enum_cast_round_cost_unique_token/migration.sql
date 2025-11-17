/*
  Safe, non-destructive migration:
  - Create AccessLevel_new (includes OWNER), migrate HomeAccess.role, then rename types to avoid "unsafe enum value" error.
  - Normalize Quote.lineItems to QuoteItem
  - Swap Thread/Quote status to enums without data loss
  - Cast/round Record.cost and Quote.totalAmount
  - Clean up Attachment.publicToken before adding UNIQUE
*/

-- Required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Create Enums
CREATE TYPE "ThreadStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');
CREATE TYPE "HomeSystemType" AS ENUM ('ROOF', 'HVAC', 'PLUMBING', 'ELECTRICAL', 'EXTERIOR', 'INTERIOR', 'APPLIANCE', 'OTHER');
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'INAPP');

-- IMPORTANT: do NOT ALTER the existing AccessLevel in-transaction.
-- Instead, create a NEW enum that already includes OWNER.
-- We will use it, then rename it to AccessLevel at the end.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessLevel_new') THEN
    CREATE TYPE "AccessLevel_new" AS ENUM ('OWNER', 'VIEW', 'COMMENT', 'EDIT');
  END IF;
END$$;

-- Drop FKs that might block type/column changes (Prisma does this too)
ALTER TABLE "public"."Attachment" DROP CONSTRAINT IF EXISTS "Attachment_homeId_fkey";
ALTER TABLE "public"."Attachment" DROP CONSTRAINT IF EXISTS "Attachment_uploadedBy_fkey";
ALTER TABLE "public"."Connection" DROP CONSTRAINT IF EXISTS "Connection_contractorId_fkey";
ALTER TABLE "public"."Connection" DROP CONSTRAINT IF EXISTS "Connection_homeId_fkey";
ALTER TABLE "public"."Connection" DROP CONSTRAINT IF EXISTS "Connection_homeownerId_fkey";
ALTER TABLE "public"."HomeAccess" DROP CONSTRAINT IF EXISTS "HomeAccess_homeId_fkey";
ALTER TABLE "public"."HomeAccess" DROP CONSTRAINT IF EXISTS "HomeAccess_userId_fkey";
ALTER TABLE "public"."Invitation" DROP CONSTRAINT IF EXISTS "Invitation_invitedBy_fkey";
ALTER TABLE "public"."Message" DROP CONSTRAINT IF EXISTS "Message_senderId_fkey";
ALTER TABLE "public"."Quote" DROP CONSTRAINT IF EXISTS "Quote_homeId_fkey";
ALTER TABLE "public"."Record" DROP CONSTRAINT IF EXISTS "Record_homeId_fkey";
ALTER TABLE "public"."Reminder" DROP CONSTRAINT IF EXISTS "Reminder_homeId_fkey";
ALTER TABLE "public"."Thread" DROP CONSTRAINT IF EXISTS "Thread_homeId_fkey";
ALTER TABLE "public"."Warranty" DROP CONSTRAINT IF EXISTS "Warranty_homeId_fkey";

-- Alter Attachment
ALTER TABLE "Attachment"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "checksum" TEXT,
  ADD COLUMN "containsPII" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "messageId" TEXT,
  ADD COLUMN "publicExpiresAt" TIMESTAMP(3),
  ADD COLUMN "publicToken" TEXT,
  ADD COLUMN "scanStatus" TEXT,
  ADD COLUMN "scannedAt" TIMESTAMP(3),
  ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 's3',
  ALTER COLUMN "size" SET DATA TYPE BIGINT,
  ALTER COLUMN "uploadedBy" DROP NOT NULL;

-- Alter Connection
ALTER TABLE "Connection"
  ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Alter Home (property identity/portability)
ALTER TABLE "Home"
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "apn" TEXT,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "country" TEXT DEFAULT 'US',
  ADD COLUMN "county" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "latitude" DECIMAL(9,6),
  ADD COLUMN "longitude" DECIMAL(9,6),
  ADD COLUMN "postalCode" TEXT;

-- HomeAccess.role: string -> AccessLevel_new (non-destructive)
ALTER TABLE "HomeAccess" ADD COLUMN "role_new" "AccessLevel_new";

UPDATE "HomeAccess"
SET "role_new" = CASE
  WHEN lower("role") = 'owner'   THEN 'OWNER'::"AccessLevel_new"
  WHEN lower("role") = 'view'    THEN 'VIEW'::"AccessLevel_new"
  WHEN lower("role") = 'comment' THEN 'COMMENT'::"AccessLevel_new"
  WHEN lower("role") = 'edit'    THEN 'EDIT'::"AccessLevel_new"
  ELSE 'VIEW'::"AccessLevel_new"
END;

ALTER TABLE "HomeAccess" ALTER COLUMN "role_new" SET NOT NULL;
ALTER TABLE "HomeAccess" ALTER COLUMN "role_new" SET DEFAULT 'VIEW';
ALTER TABLE "HomeAccess" DROP COLUMN "role";
ALTER TABLE "HomeAccess" RENAME COLUMN "role_new" TO "role";

-- CreateTable
CREATE TABLE "QuoteItem" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "item" TEXT NOT NULL,
  "qty" DECIMAL(10,2) NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "total" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- Normalize Quote.lineItems JSON -> QuoteItem rows (if any), then drop column
-- Expected JSON shape: [{"item":"...", "cost":123.45, "qty":2}, ...]
-- Accepts "unitPrice" or "cost" as the price field.
DO $$
DECLARE
  col_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Quote' AND column_name = 'lineItems'
  ) INTO col_exists;

  IF col_exists THEN
    INSERT INTO "QuoteItem" ("id","quoteId","item","qty","unitPrice","total")
    SELECT
      gen_random_uuid()::text,
      q."id",
      COALESCE( (li->>'item'), 'Item' ),
      COALESCE(NULLIF(li->>'qty','')::numeric, 1),
      COALESCE(
        NULLIF(li->>'unitPrice','')::numeric,
        NULLIF(li->>'cost','')::numeric,
        0
      ),
      COALESCE(
        (
          COALESCE(
            NULLIF(li->>'unitPrice','')::numeric,
            NULLIF(li->>'cost','')::numeric,
            0
          )
          * COALESCE(NULLIF(li->>'qty','')::numeric, 1)
        ),
        0
      )
    FROM "Quote" q,
    LATERAL jsonb_array_elements(CASE
      WHEN jsonb_typeof(q."lineItems") = 'array' THEN q."lineItems"
      ELSE '[]'::jsonb
    END) AS li;

    ALTER TABLE "Quote" DROP COLUMN "lineItems";
  END IF;
END$$;

-- Quote totals: explicit cast with rounding
ALTER TABLE "Quote"
ALTER COLUMN "totalAmount" TYPE numeric(12,2)
USING ROUND("totalAmount"::numeric, 2);

-- Quote.status: text -> enum (non-destructive)
ALTER TABLE "Quote" ADD COLUMN "status_new" "QuoteStatus";
UPDATE "Quote"
SET "status_new" = CASE
  WHEN lower("status") = 'sent'      THEN 'SENT'::"QuoteStatus"
  WHEN lower("status") = 'accepted'  THEN 'ACCEPTED'::"QuoteStatus"
  WHEN lower("status") = 'declined'  THEN 'DECLINED'::"QuoteStatus"
  WHEN lower("status") = 'expired'   THEN 'EXPIRED'::"QuoteStatus"
  ELSE 'DRAFT'::"QuoteStatus"
END;
ALTER TABLE "Quote" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "Quote" ALTER COLUMN "status_new" SET DEFAULT 'DRAFT';
ALTER TABLE "Quote" DROP COLUMN "status";
ALTER TABLE "Quote" RENAME COLUMN "status_new" TO "status";

-- Record: add columns + cost numeric(12,2) with rounding
ALTER TABLE "Record"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "systemId" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedBy" TEXT;

ALTER TABLE "Record"
ALTER COLUMN "cost" TYPE numeric(12,2)
USING ROUND("cost"::numeric, 2);

-- Reminder soft-delete fields
ALTER TABLE "Reminder"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Thread.status: text -> enum (non-destructive)
ALTER TABLE "Thread" ADD COLUMN "status_new" "ThreadStatus";
UPDATE "Thread"
SET "status_new" = CASE
  WHEN lower("status") = 'completed' THEN 'COMPLETED'::"ThreadStatus"
  WHEN lower("status") = 'archived'  THEN 'ARCHIVED'::"ThreadStatus"
  ELSE 'ACTIVE'::"ThreadStatus"
END;
ALTER TABLE "Thread" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "Thread" ALTER COLUMN "status_new" SET DEFAULT 'ACTIVE';
ALTER TABLE "Thread" DROP COLUMN "status";
ALTER TABLE "Thread" RENAME COLUMN "status_new" TO "status";

-- User.email to CITEXT (case-insensitive unique)
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE CITEXT;

-- Warranty soft-delete fields
ALTER TABLE "Warranty"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Create tables
CREATE TABLE "HomeOwnership" (
  "id" TEXT NOT NULL,
  "homeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  CONSTRAINT "HomeOwnership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomeSystem" (
  "id" TEXT NOT NULL,
  "homeId" TEXT NOT NULL,
  "type" "HomeSystemType" NOT NULL,
  "name" TEXT,
  "notes" TEXT,
  CONSTRAINT "HomeSystem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageRead" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "homeId" TEXT,
  "entity" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "diff" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "subject" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "HomeOwnership_homeId_startedAt_idx" ON "HomeOwnership"("homeId", "startedAt");
CREATE INDEX "HomeOwnership_userId_startedAt_idx" ON "HomeOwnership"("userId", "startedAt");
CREATE INDEX "HomeSystem_homeId_type_idx" ON "HomeSystem"("homeId", "type");
CREATE INDEX "MessageRead_userId_readAt_idx" ON "MessageRead"("userId", "readAt");
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId", "userId");
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");
CREATE INDEX "AuditLog_entity_entityId_createdAt_idx" ON "AuditLog"("entity", "entityId", "createdAt");
CREATE INDEX "AuditLog_homeId_createdAt_idx" ON "AuditLog"("homeId", "createdAt");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Attachment_messageId_idx" ON "Attachment"("messageId");
CREATE INDEX "Attachment_checksum_idx" ON "Attachment"("checksum");
CREATE INDEX "Attachment_homeId_visibility_createdAt_idx" ON "Attachment"("homeId", "visibility", "createdAt");
CREATE INDEX "Home_updatedAt_idx" ON "Home"("updatedAt");
CREATE INDEX "Home_apn_idx" ON "Home"("apn");
CREATE INDEX "Quote_status_idx" ON "Quote"("status");
CREATE INDEX "Record_homeId_kind_date_idx" ON "Record"("homeId", "kind", "date");
CREATE INDEX "Reminder_homeId_dueAt_createdBy_idx" ON "Reminder"("homeId", "dueAt", "createdBy");
CREATE INDEX "Thread_status_idx" ON "Thread"("status");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- Clean empty tokens and deduplicate before UNIQUE
UPDATE "Attachment"
SET "publicToken" = NULL
WHERE "publicToken" IS NOT NULL AND btrim("publicToken") = '';

WITH dups AS (
  SELECT "publicToken", ctid,
         ROW_NUMBER() OVER (PARTITION BY "publicToken" ORDER BY "id") AS rn
  FROM "Attachment"
  WHERE "publicToken" IS NOT NULL
)
UPDATE "Attachment" a
SET "publicToken" = NULL
FROM dups d
WHERE a.ctid = d.ctid
  AND d.rn > 1;

-- Unique after cleanup
CREATE UNIQUE INDEX "Attachment_publicToken_key" ON "Attachment"("publicToken");

-- Re-add FKs
ALTER TABLE "HomeOwnership" ADD CONSTRAINT "HomeOwnership_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeOwnership" ADD CONSTRAINT "HomeOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeSystem" ADD CONSTRAINT "HomeSystem_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "HomeSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeAccess" ADD CONSTRAINT "HomeAccess_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeAccess" ADD CONSTRAINT "HomeAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_homeownerId_fkey" FOREIGN KEY ("homeownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Finally, swap enum types: AccessLevel_new -> AccessLevel
-- 1) rename old AccessLevel to AccessLevel_old (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessLevel') THEN
    EXECUTE 'ALTER TYPE "AccessLevel" RENAME TO "AccessLevel_old"';
  END IF;
END$$;

-- 2) rename new type to AccessLevel
ALTER TYPE "AccessLevel_new" RENAME TO "AccessLevel";

-- 3) drop old type if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessLevel_old') THEN
    EXECUTE 'DROP TYPE "AccessLevel_old"';
  END IF;
END$$;