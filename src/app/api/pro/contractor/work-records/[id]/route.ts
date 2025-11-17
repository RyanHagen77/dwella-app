// app/api/pro/contractor/work-records/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateWorkRecordSchema = z.object({
  workType: z.string().optional(),
  workDate: z.string().optional(),
  description: z.string().nullable().optional(),
  cost: z.number().nullable().optional(),
  photos: z.array(z.string()).optional(),
  invoice: z.string().nullable().optional(),
  warranty: z.string().nullable().optional(),
});

// Helper to derive S3 key + filename from a public URL
function getKeyAndFilename(
  fileUrl: string,
  fallbackFilename: string
): { key: string; filename: string } {
  // Try to split at ".amazonaws.com/" to get the full object key
  const urlParts = fileUrl.split(".amazonaws.com/");
  const afterDomain = urlParts[1];

  const key = afterDomain || fileUrl.split("/").pop() || fallbackFilename;
  const filename = fileUrl.split("/").pop() || fallbackFilename;

  return { key, filename };
}

/**
 * PATCH /api/pro/contractor/work-records/:id
 * Update work record with file URLs after upload
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateWorkRecordSchema.parse(body);

    // Verify work record belongs to this contractor
    const workRecord = await prisma.workRecord.findFirst({
      where: {
        id,
        contractorId: session.user.id,
      },
    });

    if (!workRecord) {
      return NextResponse.json(
        { error: "Work record not found" },
        { status: 404 }
      );
    }

    // Update with file URLs
    const updated = await prisma.workRecord.update({
      where: { id },
      data: {
        ...(data.workType && { workType: data.workType }),
        ...(data.workDate && { workDate: new Date(data.workDate) }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.photos && { photos: data.photos }),
        ...(data.invoice !== undefined && { invoiceUrl: data.invoice }),
        // If you eventually add a warrantyUrl column, you can set it here too.
      },
    });

    // Create Attachment records for homeowner visibility (only if they don't exist)
    const attachmentsToCreate: {
      homeId: string;
      recordId: string | null;
      workRecordId: string;
      filename: string;
      url: string;
      mimeType: string;
      size: number;
      key: string;
      visibility: "HOME";
      uploadedBy: string;
    }[] = [];

    // ---------- Photos ----------
    if (data.photos && data.photos.length > 0) {
      const existingAttachments = await prisma.attachment.findMany({
        where: {
          workRecordId: id,
          url: { in: data.photos },
        },
        select: { url: true },
      });

      const existingUrls = new Set(existingAttachments.map((a) => a.url));

      data.photos.forEach((photoUrl) => {
        if (existingUrls.has(photoUrl)) return;

        const { key, filename } = getKeyAndFilename(photoUrl, "photo.jpg");

        attachmentsToCreate.push({
          homeId: workRecord.homeId,
          recordId: null,
          workRecordId: id,
          filename,
          url: photoUrl,
          mimeType: "image/jpeg",
          size: 0,
          key,
          visibility: "HOME",
          uploadedBy: session.user.id,
        });
      });
    }

    // ---------- Invoice ----------
    if (data.invoice) {
      const existingInvoice = await prisma.attachment.findFirst({
        where: {
          workRecordId: id,
          url: data.invoice,
        },
      });

      if (!existingInvoice) {
        const { key, filename } = getKeyAndFilename(
          data.invoice,
          "invoice.pdf"
        );

        attachmentsToCreate.push({
          homeId: workRecord.homeId,
          recordId: null,
          workRecordId: id,
          filename,
          url: data.invoice,
          mimeType: "application/pdf",
          size: 0,
          key,
          visibility: "HOME",
          uploadedBy: session.user.id,
        });
      }
    }

    // ---------- Warranty ----------
    if (data.warranty) {
      const existingWarranty = await prisma.attachment.findFirst({
        where: {
          workRecordId: id,
          url: data.warranty,
        },
      });

      if (!existingWarranty) {
        const { key, filename } = getKeyAndFilename(
          data.warranty,
          "warranty.pdf"
        );

        attachmentsToCreate.push({
          homeId: workRecord.homeId,
          recordId: null,
          workRecordId: id,
          filename,
          url: data.warranty,
          mimeType: "application/pdf",
          size: 0,
          key,
          visibility: "HOME",
          uploadedBy: session.user.id,
        });
      }
    }

    // Create only new attachments
    if (attachmentsToCreate.length > 0) {
      await prisma.attachment.createMany({
        data: attachmentsToCreate,
      });
    }

    return NextResponse.json({
      success: true,
      workRecord: updated,
    });
  } catch (error) {
    console.error("Error updating work record:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update work record" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pro/contractor/work-records/:id
 * Get single work record
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workRecord = await prisma.workRecord.findFirst({
    where: {
      id,
      contractorId: session.user.id,
    },
    include: {
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      contractor: {
        select: {
          id: true,
          name: true,
          proProfile: {
            select: {
              businessName: true,
              company: true,
            },
          },
        },
      },
    },
  });

  if (!workRecord) {
    return NextResponse.json(
      { error: "Work record not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ workRecord });
}

/**
 * DELETE /api/pro/contractor/work-records/:id
 * Delete a work record
 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workRecord = await prisma.workRecord.findFirst({
      where: {
        id,
        contractorId: session.user.id,
      },
    });

    if (!workRecord) {
      return NextResponse.json(
        { error: "Work record not found" },
        { status: 404 }
      );
    }

    await prisma.workRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting work record:", error);
    return NextResponse.json(
      { error: "Failed to delete work record" },
      { status: 500 }
    );
  }
}