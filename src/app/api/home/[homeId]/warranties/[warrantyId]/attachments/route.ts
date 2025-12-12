// src/app/api/stats/[homeId]/warranties/[warrantyId]/attachments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { AttachmentPersistItemSchema } from "@/lib/validators";

type Params = { homeId: string; warrantyId: string };
export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { homeId, warrantyId } = await ctx.params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireHomeAccess(homeId, session.user.id);

  // Verify warranty belongs to this home
  const warranty = await prisma.warranty.findUnique({
    where: { id: warrantyId },
    select: { homeId: true },
  });

  if (!warranty || warranty.homeId !== homeId) {
    return NextResponse.json({ error: "Warranty not found" }, { status: 404 });
  }

  const raw = await req.json().catch(() => null);
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "No attachments" }, { status: 400 });
  }

  const items: Array<{
    filename: string;
    size: number;
    contentType: string;
    storageKey: string;
    visibility: "OWNER" | "HOME" | "PUBLIC";
    url: string; // enforce string here
    notes: string | null;
  }> = [];

  const errors: Array<{ index: number; issues: unknown }> = [];

  for (let idx = 0; idx < raw.length; idx++) {
    const res = AttachmentPersistItemSchema.safeParse(raw[idx]);
    if (!res.success) {
      // ✅ Zod: use issues (no deprecated format/flatten)
      errors.push({ index: idx, issues: res.error.issues });
      continue;
    }

    const data = res.data;

    // ✅ regardless of inferred type, enforce "non-empty string" at runtime
    const url = (data.url ?? "").trim();
    if (!url) {
      errors.push({
        index: idx,
        issues: [{ path: ["url"], message: "Missing url", code: "custom" }],
      });
      continue;
    }

    items.push({
      filename: data.filename,
      size: data.size,
      contentType: data.contentType,
      storageKey: data.storageKey,
      visibility: data.visibility,
      url,
      notes: data.notes ?? null,
    });
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation error", errors }, { status: 400 });
  }

  await prisma.attachment.createMany({
    data: items.map((i) => ({
      homeId,
      warrantyId,

      key: i.storageKey,
      url: i.url, // ✅ string
      filename: i.filename,
      mimeType: i.contentType,
      size: BigInt(Math.max(0, Number(i.size) || 0)),

      uploadedBy: session.user.id,

      // guardrail: explicitly null all other parents
      recordId: null,
      reminderId: null,
      serviceRecordId: null,
      serviceRequestId: null,
      serviceSubmissionId: null,
      messageId: null,

      visibility: i.visibility,
      notes: i.notes,
    })),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}