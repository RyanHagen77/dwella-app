/**
 * MESSAGES INBOX PAGE
 *
 * Shows all active conversations for ANY pro type (contractor, realtor, inspector).
 * Lists connections with unread counts and last messages preview.
 *
 * Location: app/(pro)/pro/messages/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";
import { MessagesList } from "./_components/MessagesList";

export default async function MessagesPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || session.user.role !== "PRO") {
    redirect("/login");
  }

  const userId = session.user.id;

  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { contractorId: userId },
        { realtorId: userId },
        { inspectorId: userId },
      ],
      status: "ACTIVE",
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
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          reads: { where: { userId } },
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              reads: { none: { userId } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const conversations = connections
    .filter((c) => c.homeowner && c.home) // extra safety
    .map((conn) => {
      const lastMessage = conn.messages[0] ?? null;
      const unreadCount = conn._count.messages ?? 0;

      const homeownerName =
        conn.homeowner.name ||
        conn.homeowner.email ||
        "Homeowner";

      return {
        connectionId: conn.id,
        homeowner: {
          name: homeownerName,
          image: conn.homeowner.image ?? null,
        },
        property: {
          address: conn.home.address ?? "",
          city: conn.home.city ?? "",
          state: conn.home.state ?? "",
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.reads.length > 0,
            }
          : null,
        unreadCount,
      };
    });

  const conversationsCount = conversations.length;

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/pro/contractor/dashboard"
            className="text-white/70 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white">Messages</span>
        </nav>

        {/* Header w/ back arrow */}
        <section className={glass}>
          <div className="flex items-center gap-3">
            <Link
              href="/pro/contractor/dashboard"
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Back to dashboard"
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

            <div className="min-w-0">
              <h1 className={`text-2xl font-bold ${heading}`}>
                Messages
              </h1>
              <p className={`mt-1 text-sm ${textMeta}`}>
                Communicate with homeowners about your work.
              </p>
              <p className={`mt-1 text-xs ${textMeta}`}>
                {conversationsCount} active conversation
                {conversationsCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </section>

        {/* Conversations List - Client Component with polling */}
        <section className={glass}>
          <MessagesList initialConversations={conversations} />
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