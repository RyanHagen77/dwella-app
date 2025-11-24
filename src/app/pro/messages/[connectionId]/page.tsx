/**
 * INDIVIDUAL CHAT PAGE
 *
 * Real-time messaging interface for a specific connection.
 * Works for ALL pro types (contractor, realtor, inspector).
 * Shows message history and allows sending new messages.
 *
 * Location: app/(pro)/pro/messages/[connectionId]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";
import { MessageThread } from "./_components/MessageThread";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ connectionId: string }>;
}) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || session.user.role !== "PRO") {
    redirect("/login");
  }

  const { connectionId } = await params;
  const userId = session.user.id;

  // Get connection details (supports any pro type)
  const connection = await prisma.connection.findFirst({
    where: {
      id: connectionId,
      OR: [
        { contractorId: userId },
        { realtorId: userId },
        { inspectorId: userId },
      ],
    },
    include: {
      homeowner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      home: {
        select: {
          address: true,
          city: true,
          state: true,
        },
      },
    },
  });

  if (!connection || !connection.homeowner || !connection.home) {
    notFound();
  }

  // Get messages
  const messages = await prisma.message.findMany({
    where: { connectionId },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
      attachments: {
        select: { id: true, filename: true, mimeType: true, url: true },
      },
      reads: { where: { userId } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const otherUser = {
    id: connection.homeowner.id,
    name:
      connection.homeowner.name ||
      connection.homeowner.email ||
      "Homeowner",
    image: connection.homeowner.image,
  };

  const addressLine = [
    connection.home.address,
    connection.home.city,
    connection.home.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/pro"
            className="text-white/70 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <Link
            href="/pro/messages"
            className="text-white/70 hover:text-white transition-colors"
          >
            Messages
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white truncate max-w-[40%]">
            {otherUser.name}
          </span>
        </nav>

        {/* Chat header */}
        <section className={glass}>
          <div className="flex items-center gap-3">
            <Link
              href="/pro/messages"
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Back to messages"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </Link>

            {otherUser.image ? (
              <Image
                src={otherUser.image}
                alt={otherUser.name}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-medium">
                  {otherUser.name[0]?.toUpperCase() || "?"}
                </span>
              </div>
            )}

            <div className="min-w-0">
              <h1 className={`text-lg font-semibold ${heading} truncate`}>
                {otherUser.name}
              </h1>
              {addressLine && (
                <p className={`text-sm ${textMeta} truncate`}>
                  {addressLine}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Messages thread (darker shell so composer doesn't look disabled) */}
        <section
          className="
            rounded-2xl border border-white/15
            bg-black/45 backdrop-blur-sm
            flex min-h-[60vh] flex-col overflow-hidden
          "
        >
          <div className="flex-1 min-h-[300px] overflow-hidden">
            <MessageThread
              connectionId={connectionId}
              initialMessages={messages}
              currentUserId={userId}
              otherUser={otherUser}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Bg() {
  return (
    <div className="fixed inset-0 -z-50">
      <Image
        src="/myhomedox_home3.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
    </div>
  );
}