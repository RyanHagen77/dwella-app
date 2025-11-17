// app/api/uploads/presign/route.ts
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET, buildRecordKey, PUBLIC_S3_URL_PREFIX } from "@/lib/s3";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export const runtime = "nodejs";

/**
 * POST /api/uploads/presign
 * Generate presigned URL for uploads
 * Works for both homeowners (records/reminders/warranties) and contractors (work records)
 */
export async function POST(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { homeId, recordId, warrantyId, reminderId, filename, contentType, size } = body;

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

    // Check if user is a contractor with active connection
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { proProfile: true },
    });

    const isContractor = user?.role === "PRO" && user.proProfile?.type === "CONTRACTOR";

    if (isContractor) {
      // Contractor flow - verify active connection
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

      // Verify work record if provided
      if (recordId) {
        const workRecord = await prisma.workRecord.findFirst({
          where: {
            id: recordId,
            homeId,
            contractorId: session.user.id,
          },
        });

        if (!workRecord) {
          return NextResponse.json(
            { error: "Work record not found or access denied" },
            { status: 403 }
          );
        }
      }
    } else {
      // Homeowner flow - verify home access
      await requireHomeAccess(homeId, session.user.id);
    }

    // Determine the entity ID
    const entityId = recordId || warrantyId || reminderId;
    if (!entityId) {
      return NextResponse.json(
        { error: "Missing entity ID (recordId, warrantyId, or reminderId)" },
        { status: 400 }
      );
    }

    // Build the S3 key
    const key = buildRecordKey(homeId, entityId, filename);

    // Create presigned URL
    const cmd = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 }); // 5 minutes

    // Public GET URL
    const publicUrl = PUBLIC_S3_URL_PREFIX
      ? `${PUBLIC_S3_URL_PREFIX}/${key}`
      : null;

    return NextResponse.json({ key, url, publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}