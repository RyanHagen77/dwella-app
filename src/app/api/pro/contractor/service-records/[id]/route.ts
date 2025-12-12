import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { AttachmentVisibility, WarrantyStatus } from "@prisma/client";

export const runtime = "nodejs";

/* ----------------------------- Zod schema ----------------------------- */

const updateServiceRecordSchema = z.object({
  serviceType: z.string().optional(),
  serviceDate: z.string().optional(),
  description: z.string().nullable().optional(),
  cost: z.number().nullable().optional(),

  photos: z.array(z.string()).optional(),
  invoice: z.string().nullable().optional(),
  warranty: z.string().nullable().optional(), // public S3 URL

  // service record warranty meta (contractor-facing)
  warrantyIncluded: z.boolean().optional(),
  warrantyLength: z.string().nullable().optional(),
  warrantyDetails: z.string().nullable().optional(),

  // ✅ structured warranty fields (homeowner-facing Warranty table)
  warrantyItem: z.string().nullable().optional(),
  warrantyProvider: z.string().nullable().optional(),
  warrantyPolicyNo: z.string().nullable().optional(),
  warrantyPurchasedAt: z.string().nullable().optional(),
  warrantyExpiresAt: z.string().nullable().optional(),
  warrantyNote: z.string().nullable().optional(),
});

/* ----------------------------- helpers ----------------------------- */

function safeDateFromISO(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getKeyAndFilename(url: string, fallback: string) {
  const after = url.split(".amazonaws.com/")[1];
  return {
    key: after || url.split("/").pop() || fallback,
    filename: url.split("/").pop() || fallback,
  };
}

type AttachmentCreate = {
  homeId: string;
  recordId: string | null;
  serviceRecordId: string;
  warrantyId?: string | null;

  filename: string;
  url: string;
  mimeType: string;
  size: bigint;
  key: string;

  visibility: AttachmentVisibility;
  uploadedBy: string;
  notes?: string | null;
};

/* =============================== PATCH =============================== */

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = updateServiceRecordSchema.parse(await req.json());

    const serviceRecord = await prisma.serviceRecord.findFirst({
      where: { id, contractorId: session.user.id },
      select: { id: true, homeId: true, serviceType: true, warrantyDetails: true },
    });

    if (!serviceRecord) {
      return NextResponse.json({ error: "Service record not found" }, { status: 404 });
    }

    const warrantyUrl = data.warranty ?? null;

    // structured dates
    const purchasedAt = safeDateFromISO(data.warrantyPurchasedAt);
    const expiresAt = safeDateFromISO(data.warrantyExpiresAt);

    const result = await prisma.$transaction(async (tx) => {
      /* -------- update service record -------- */
      const updated = await tx.serviceRecord.update({
        where: { id },
        data: {
          ...(data.serviceType && { serviceType: data.serviceType }),
          ...(data.serviceDate && { serviceDate: new Date(data.serviceDate) }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.cost !== undefined && { cost: data.cost }),
          ...(data.photos && { photos: data.photos }),
          ...(data.invoice !== undefined && { invoiceUrl: data.invoice }),

          ...(data.warrantyIncluded !== undefined && { warrantyIncluded: data.warrantyIncluded }),
          ...(data.warrantyLength !== undefined && { warrantyLength: data.warrantyLength }),
          ...(data.warrantyDetails !== undefined && { warrantyDetails: data.warrantyDetails }),
        },
        select: {
          id: true,
          homeId: true,
          serviceType: true,
          serviceDate: true,
          description: true,
          cost: true,
          status: true,
          isVerified: true,
          verifiedAt: true,
          warrantyIncluded: true,
          warrantyLength: true,
          warrantyDetails: true,
          invoiceUrl: true,
          photos: true,
        },
      });

      /* -------- warranty (Option B; structured, no parsing) -------- */
      const hasStructuredWarranty =
        (data.warrantyItem ?? null) !== null ||
        (data.warrantyProvider ?? null) !== null ||
        (data.warrantyPolicyNo ?? null) !== null ||
        (data.warrantyNote ?? null) !== null ||
        purchasedAt !== null ||
        expiresAt !== null;

      const shouldTouchWarranty =
        data.warrantyIncluded === true ||
        hasStructuredWarranty ||
        !!warrantyUrl;

      let warrantyRow:
        | {
            id: string;
            homeId: string;
            item: string;
            provider: string | null;
            policyNo: string | null;
            purchasedAt: Date | null;
            expiresAt: Date | null;
            note: string | null;
            status: WarrantyStatus;
            acceptedAt: Date | null;
          }
        | null = null;

      if (shouldTouchWarranty) {
        const existing = await tx.warranty.findFirst({
          where: { serviceRecordId: id, homeId: serviceRecord.homeId },
          select: {
            id: true,
            homeId: true,
            item: true,
            provider: true,
            policyNo: true,
            purchasedAt: true,
            expiresAt: true,
            note: true,
            status: true,
            acceptedAt: true,
          },
        });

        // prefer explicit warrantyItem; otherwise fall back to service type
        const item = (data.warrantyItem || updated.serviceType || serviceRecord.serviceType || "Service Warranty").slice(
          0,
          120
        );

        // IMPORTANT: write structured fields directly to Warranty table
        const provider = data.warrantyProvider ?? (existing?.provider ?? null);
        const policyNo = data.warrantyPolicyNo ?? (existing?.policyNo ?? null);
        const note =
          data.warrantyNote ??
          // if you still want a fallback, use serviceRecord warrantyDetails
          (data.warrantyDetails ?? updated.warrantyDetails ?? serviceRecord.warrantyDetails ?? null);

        if (existing) {
          warrantyRow = await tx.warranty.update({
            where: { id: existing.id },
            data: {
              item,
              provider,
              policyNo,
              note,
              ...(purchasedAt !== null && { purchasedAt }),
              ...(expiresAt !== null && { expiresAt }),
              status: existing.status === "ACTIVE" ? "ACTIVE" : "PENDING",
            },
            select: {
              id: true,
              homeId: true,
              item: true,
              provider: true,
              policyNo: true,
              purchasedAt: true,
              expiresAt: true,
              note: true,
              status: true,
              acceptedAt: true,
            },
          });
        } else {
          warrantyRow = await tx.warranty.create({
            data: {
              homeId: serviceRecord.homeId,
              serviceRecordId: id,
              item,
              provider: data.warrantyProvider ?? null,
              policyNo: data.warrantyPolicyNo ?? null,
              purchasedAt,
              expiresAt,
              note,
              status: "PENDING",
              createdBy: session.user.id,
            },
            select: {
              id: true,
              homeId: true,
              item: true,
              provider: true,
              policyNo: true,
              purchasedAt: true,
              expiresAt: true,
              note: true,
              status: true,
              acceptedAt: true,
            },
          });
        }
      }

      /* -------- attachments -------- */
      const attachmentsToCreate: AttachmentCreate[] = [];

      // photos
      if (data.photos && data.photos.length > 0) {
        const existingPhotos = await tx.attachment.findMany({
          where: { serviceRecordId: id, url: { in: data.photos } },
          select: { url: true },
        });
        const existing = new Set(existingPhotos.map((a) => a.url));

        for (const photoUrl of data.photos) {
          if (existing.has(photoUrl)) continue;
          const { key, filename } = getKeyAndFilename(photoUrl, "photo.jpg");
          attachmentsToCreate.push({
            homeId: serviceRecord.homeId,
            recordId: null,
            serviceRecordId: id,
            filename,
            url: photoUrl,
            mimeType: "image/jpeg",
            size: BigInt(0),
            key,
            visibility: "HOME",
            uploadedBy: session.user.id,
            notes: "PHOTO",
          });
        }
      }

      // invoice
      if (data.invoice) {
        const existingInvoice = await tx.attachment.findFirst({
          where: { serviceRecordId: id, url: data.invoice },
          select: { id: true },
        });

        if (!existingInvoice) {
          const { key, filename } = getKeyAndFilename(data.invoice, "invoice.pdf");
          attachmentsToCreate.push({
            homeId: serviceRecord.homeId,
            recordId: null,
            serviceRecordId: id,
            filename,
            url: data.invoice,
            mimeType: "application/pdf",
            size: BigInt(0),
            key,
            visibility: "HOME",
            uploadedBy: session.user.id,
            notes: "INVOICE",
          });
        }
      }

      // warranty file
      if (warrantyUrl) {
        const existingWarrantyAttachment = await tx.attachment.findFirst({
          where: { serviceRecordId: id, url: warrantyUrl },
          select: { id: true },
        });

        if (!existingWarrantyAttachment) {
          const { key, filename } = getKeyAndFilename(warrantyUrl, "warranty.pdf");
          attachmentsToCreate.push({
            homeId: serviceRecord.homeId,
            recordId: null,
            serviceRecordId: id,
            warrantyId: warrantyRow?.id ?? null,
            filename,
            url: warrantyUrl,
            mimeType: "application/pdf",
            size: BigInt(0),
            key,
            visibility: "HOME",
            uploadedBy: session.user.id,
            notes: "WARRANTY",
          });
        }
      }

      if (attachmentsToCreate.length) {
        await tx.attachment.createMany({ data: attachmentsToCreate });
      }

      return { updated, warranty: warrantyRow };
    });

    return NextResponse.json({ success: true, serviceRecord: result.updated, warranty: result.warranty });
  } catch (err) {
    console.error(err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update service record" }, { status: 500 });
  }
}

/* =============================== GET =============================== */

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceRecord = await prisma.serviceRecord.findFirst({
    where: { id, contractorId: session.user.id },
    include: {
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          owner: { select: { id: true, name: true, email: true } },
        },
      },
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true,
          notes: true,
          warrantyId: true,
        },
      },
    },
  });

  if (!serviceRecord) return NextResponse.json({ error: "Service record not found" }, { status: 404 });

  const warranty = await prisma.warranty.findFirst({
    where: { serviceRecordId: id, homeId: serviceRecord.homeId },
    select: {
      id: true,
      item: true,
      provider: true,
      policyNo: true,
      purchasedAt: true,
      expiresAt: true,
      note: true,
      status: true,
      acceptedAt: true,
      acceptedBy: true,
    },
  });

  return NextResponse.json({ serviceRecord, warranty });
}

/* =============================== DELETE =============================== */

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await prisma.serviceRecord.findFirst({
    where: { id, contractorId: session.user.id },
    select: { id: true },
  });

  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.serviceRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}