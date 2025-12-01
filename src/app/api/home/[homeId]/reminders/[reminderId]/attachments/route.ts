// src/app/api/stats/[homeId]/reminders/[reminderId]/attachments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { AttachmentPersistItemSchema } from "@/lib/validators";

type Params = { homeId: string; reminderId: string };
export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { homeId, reminderId } = await ctx.params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requireHomeAccess(homeId, session.user.id);

  const raw = await req.json().catch(() => []);
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "No attachments" }, { status: 400 });
  }

  const items = raw.map((i) => AttachmentPersistItemSchema.parse(i));

  await prisma.attachment.createMany({
    data: items.map((i) => ({
      homeId,
      reminderId,

      key: i.storageKey,
      url: i.url ?? "",
      filename: i.filename,
      mimeType: i.contentType,
      size: Math.max(0, Number(i.size) || 0),

      uploadedBy: session.user.id,

      // other parents explicitly null to keep guardrail invariant
      recordId: null,
      warrantyId: null,

      // NEW
      visibility: i.visibility,
      notes: i.notes,
    })),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}