// src/app/api/home/[homeId]/attachments/[attachmentId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ homeId: string; attachmentId: string }> }
) {
  const { homeId, attachmentId } = await params;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.error("[Attachment] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a contractor with active connection
    const isContractor = await prisma.connection.findFirst({
      where: {
        contractorId: session.user.id,
        homeId,
        status: "ACTIVE",
      },
    });

    // Check stats access (for homeowners) OR contractor access
    if (!isContractor) {
      try {
        await requireHomeAccess(homeId, session.user.id);
      } catch (error) {
        console.error("[Attachment] Access denied to stats:", homeId, error);
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get the attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        homeId: true,
        key: true,
        filename: true,
        mimeType: true,
      },
    });

    if (!attachment) {
      console.error("[Attachment] Not found:", attachmentId);
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    if (attachment.homeId !== homeId) {
      console.error("[Attachment] Home mismatch:", { attachmentHome: attachment.homeId, requestedHome: homeId });
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    console.log("[Attachment] Generating signed URL for:", {
      id: attachmentId,
      key: attachment.key,
      bucket: process.env.S3_BUCKET,
    });

    // Generate signed URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: attachment.key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    console.log("[Attachment] Signed URL generated successfully");

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("[Attachment] Failed to generate signed URL:", error);
    console.error("[Attachment] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to access attachment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ homeId: string; attachmentId: string }> }
) {
  const { homeId, attachmentId } = await params;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.error("[Attachment DELETE] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify home access (only homeowner can delete)
    await requireHomeAccess(homeId, session.user.id);

    // Get the attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        homeId: true,
        key: true,
      },
    });

    if (!attachment) {
      console.error("[Attachment DELETE] Not found:", attachmentId);
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    if (attachment.homeId !== homeId) {
      console.error("[Attachment DELETE] Home mismatch");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("[Attachment DELETE] Deleting attachment:", attachmentId);

    // Delete from database
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    // Delete from S3
    if (attachment.key) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: attachment.key,
          })
        );
        console.log("[Attachment DELETE] Deleted from S3:", attachment.key);
      } catch (s3Error) {
        console.error("[Attachment DELETE] Failed to delete from S3:", s3Error);
        // Continue anyway since DB record is deleted
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Attachment DELETE] Failed:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}