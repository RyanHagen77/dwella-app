// app/api/pro/contractor/document-completed-work-submissions-records-records/[workId]/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "myhomedox-files";
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
 * POST /api/pro/contractor/document-completed-work-submissions-records-records/:id/upload
 * Generate presigned URLs for uploading files to S3
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: workRecordId } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify document-completed-work-submissions-records record belongs to this contractor
  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    include: { home: true },
  });

  if (!workRecord) {
    return NextResponse.json(
      { error: "Work record not found" },
      { status: 404 }
    );
  }

  if (workRecord.contractorId !== session.user.id) {
    return NextResponse.json(
      { error: "You do not own this document-completed-work-submissions-records record" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { files } = body;

    if (!files || !Array.isArray(files)) {
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

      // Validate file type based on category
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
      files.map(async (file: any) => {
        const fileId = crypto.randomUUID();
        const extension = file.name.split(".").pop();
        const timestamp = Date.now();

        // S3 key structure: homes/{homeId}/document-completed-work-submissions-records-records/{workRecordId}/{category}/{timestamp}-{fileId}.{ext}
        const key = `homes/${workRecord.homeId}/work-records/${workRecordId}/${file.category}/${timestamp}-${fileId}.${extension}`;

        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          ContentType: file.type,
          Metadata: {
            workRecordId,
            uploadedBy: session.user.id,
            originalName: file.name,
          },
        });

        const presignedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600, // 1 hour
        });

        return {
          fileId,
          fileName: file.name,
          category: file.category,
          uploadUrl: presignedUrl,
          key,
          publicUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
        };
      })
    );

    return NextResponse.json({
      success: true,
      uploadUrls,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error generating upload URLs:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URLs" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pro/contractor/document-completed-work-submissions-records-records/:id/upload
 * Confirm uploads and save S3 keys to document-completed-work-submissions-records record
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: workRecordId } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify document-completed-work-submissions-records record belongs to this contractor
  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
  });

  if (!workRecord) {
    return NextResponse.json(
      { error: "Work record not found" },
      { status: 404 }
    );
  }

  if (workRecord.contractorId !== session.user.id) {
    return NextResponse.json(
      { error: "You do not own this document-completed-work-submissions-records record" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { uploadedFiles } = body;

    // Organize files by category
    const photos: string[] = [];
    let invoiceUrl: string | null = null;
    let warrantyUrl: string | null = null;

    for (const file of uploadedFiles) {
      if (file.category === "photo") {
        photos.push(file.publicUrl);
      } else if (file.category === "invoice") {
        invoiceUrl = file.publicUrl;
      } else if (file.category === "warranty") {
        warrantyUrl = file.publicUrl;
      }
    }

    // Update document-completed-work-submissions-records record with file URLs
    const updated = await prisma.workRecord.update({
      where: { id: workRecordId },
      data: {
        photos: {
          set: photos, // Replace existing photos
        },
        ...(invoiceUrl && { invoiceUrl }),
        ...(warrantyUrl && { warrantyUrl }),
      },
    });

    return NextResponse.json({
      success: true,
      workRecord: updated,
      message: "Files uploaded successfully",
    });
  } catch (error) {
    console.error("Error confirming uploads:", error);
    return NextResponse.json(
      { error: "Failed to confirm uploads" },
      { status: 500 }
    );
  }
}