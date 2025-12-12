// src/app/api/home/[homeId]/attachments/[attachmentId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ homeId: string; attachmentId: string }> }
) {
  const { homeId, attachmentId } = await params;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1) Fetch attachment first (so we can authorize correctly)
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        homeId: true,
        key: true,
        filename: true,
        mimeType: true,
        serviceRecordId: true,
        serviceRecord: {
          select: { contractorId: true },
        },
      },
    });

    if (!attachment || attachment.homeId !== homeId) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // 2) Authorize:
    //    - homeowner/home access OR
    //    - contractor who owns the service record (works even if home unclaimed) OR
    //    - contractor with active connection
    let allowed = false;

    // Contractor owns the ServiceRecord that produced this attachment
    if (attachment.serviceRecord?.contractorId === session.user.id) {
      allowed = true;
    }

    // Active connection contractor (optional; keep if desired)
    if (!allowed) {
      const hasActiveConnection = await prisma.connection.findFirst({
        where: {
          contractorId: session.user.id,
          homeId,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (hasActiveConnection) allowed = true;
    }

    // Homeowner access (owner/shared)
    if (!allowed) {
      try {
        await requireHomeAccess(homeId, session.user.id);
        allowed = true;
      } catch {
        // ignore
      }
    }

    if (!allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 3) Signed download
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: attachment.key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("[Attachment GET] Failed:", error);
    return NextResponse.json(
      { error: "Failed to access attachment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ homeId: string; attachmentId: string }> }
) {
  const { homeId, attachmentId } = await params;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only homeowner/shared-home access can delete
    await requireHomeAccess(homeId, session.user.id);

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        homeId: true,
        key: true,
      },
    });

    if (!attachment || attachment.homeId !== homeId) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete DB row first
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    // Then delete from S3
    if (attachment.key) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: attachment.key,
        })
      );
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