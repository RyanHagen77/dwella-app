// app/api/pro/contractor/service-records/[id]/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { s3, S3_BUCKET, PUBLIC_S3_URL_PREFIX } from "@/lib/s3";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

/**
 * POST /api/pro/contractor/service-records/:id/upload
 * Generate presigned URLs for uploading files to S3
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: serviceRecordId } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify service record belongs to this contractor
  const serviceRecord = await prisma.serviceRecord.findUnique({
    where: { id: serviceRecordId },
    include: { home: true },
  });

  if (!serviceRecord) {
    return NextResponse.json(
      { error: "Work record not found" },
      { status: 404 }
    );
  }

  if (serviceRecord.contractorId !== session.user.id) {
    return NextResponse.json(
      { error: "You do not own this service record" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { files } = body as {
      files?: {
        name: string;
        type: string;
        size: number;
        category: "photo" | "invoice" | "warranty";
      }[];
    };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: files array required" },
        { status: 400 }
      );
    }

    // Validate file specs
    for (const file of files) {
      if (!file.name || !file.type || !file.size) {
        return NextResponse.json(
          { error: "Each file must have name, type, and size" },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }

      if (file.category === "photo") {
        if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: `File ${file.name} must be an image` },
            { status: 400 }
          );
        }
      } else if (file.category === "invoice" || file.category === "warranty") {
        if (!ALLOWED_DOC_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: `File ${file.name} must be PDF or image` },
            { status: 400 }
          );
        }
      }
    }

    // Generate presigned URLs for each file
    const uploadUrls = await Promise.all(
      files.map(async (file) => {
        const fileId = crypto.randomUUID();
        const extension = file.name.split(".").pop() || "bin";
        const timestamp = Date.now();

        // homes/{homeId}/service-records/{serviceRecordId}/{category}/{timestamp}-{fileId}.{ext}
        const key = `homes/${serviceRecord.homeId}/service-records/${serviceRecordId}/${file.category}/${timestamp}-${fileId}.${extension}`;

        const command = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          ContentType: file.type,
          Metadata: {
            serviceRecordId,
            uploadedBy: session.user.id,
            originalName: file.name,
          },
        });

        const uploadUrl = await getSignedUrl(s3, command, {
          expiresIn: 3600, // 1 hour
        });

        return {
          fileId,
          fileName: file.name,
          category: file.category,
          uploadUrl,
          key,
          publicUrl: `${PUBLIC_S3_URL_PREFIX}/${key}`,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        uploadUrls,
        expiresIn: 3600,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating upload URLs:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URLs" },
      { status: 500 }
    );
  }
}