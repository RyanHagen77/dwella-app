// app/api/uploads/presign/route.ts
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  s3,
  buildRecordKey,
  buildReminderKey,
  buildWarrantyKey,
  buildServiceRequestKey,
} from "@/lib/s3";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export const runtime = "nodejs";

// --- ENV CONFIG ---
const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.AWS_REGION;
const PUBLIC_PREFIX = process.env.PUBLIC_S3_URL_PREFIX;

if (!BUCKET) throw new Error("Missing env: S3_BUCKET");
if (!REGION) throw new Error("Missing env: AWS_REGION");
if (!PUBLIC_PREFIX) throw new Error("Missing env: PUBLIC_S3_URL_PREFIX");

/**
 * POST /api/uploads/presign
 * Generate presigned upload URL for homeowners + contractors
 */
export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      homeId,
      recordId,
      warrantyId,
      reminderId,
      serviceRequestId,
      filename,
      contentType,
      size,
    } = body;

    if (!homeId || !filename || typeof size !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: homeId, filename, size" },
        { status: 400 }
      );
    }

    if (!contentType) {
      return NextResponse.json(
        { error: "Missing contentType" },
        { status: 400 }
      );
    }

    // --- Determine user type ---
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { proProfile: true },
    });

    const isContractor =
      user?.role === "PRO" && user.proProfile?.type === "CONTRACTOR";

    /**
     * CONTRACTOR FLOW
     */
    if (isContractor) {
      const connection = await prisma.connection.findFirst({
        where: {
          contractorId: session.user.id,
          homeId,
          status: "ACTIVE",
        },
      });

      if (!connection) {
        return NextResponse.json(
          { error: "You don't have access to this property" },
          { status: 403 }
        );
      }

      if (recordId) {
        const serviceRecord = await prisma.serviceRecord.findFirst({
          where: {
            id: recordId,
            homeId,
            contractorId: session.user.id,
          },
        });

        if (!serviceRecord) {
          return NextResponse.json(
            { error: "Work record not found or access denied" },
            { status: 403 }
          );
        }
      }
    }

    /**
     * HOMEOWNER FLOW
     */
    else {
      await requireHomeAccess(homeId, session.user.id);

      if (serviceRequestId) {
        const serviceRequest = await prisma.serviceRequest.findFirst({
          where: {
            id: serviceRequestId,
            homeId,
            homeownerId: session.user.id,
          },
        });

        if (!serviceRequest) {
          return NextResponse.json(
            { error: "Job request not found or access denied" },
            { status: 403 }
          );
        }
      }
    }

    // --- Determine correct S3 key using builders ---
    let key: string;

    if (serviceRequestId) {
      key = buildServiceRequestKey(homeId, serviceRequestId, filename);
    } else if (warrantyId) {
      key = buildWarrantyKey(homeId, warrantyId, filename);
    } else if (reminderId) {
      key = buildReminderKey(homeId, reminderId, filename);
    } else if (recordId) {
      key = buildRecordKey(homeId, recordId, filename);
    } else {
      return NextResponse.json(
        {
          error:
            "Missing entity identifier: recordId, warrantyId, reminderId, or serviceRequestId",
        },
        { status: 400 }
      );
    }

    // --- Generate S3 presigned PUT URL ---
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      Metadata: {
        uploadedBy: session.user.id,
      },
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 });

    const publicUrl = `${PUBLIC_PREFIX}/${key}`;

    return NextResponse.json({ key, url, publicUrl }, { status: 200 });
  } catch (err) {
    console.error("Presign error:", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}