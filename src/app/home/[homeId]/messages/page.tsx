/**
 * HOMEOWNER MESSAGES INBOX PAGE
 *
 * Shows all conversations with contractors for THIS specific home.
 * Lists connections with unread counts and last message preview.
 * Includes archived conversations (read-only) for disconnected contractors.
 *
 * Location: app/home/[homeId]/messages/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { glass, heading, textMeta } from "@/lib/glass";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { MessagesListClient } from "./MessagesListClient";

export default async function HomeMessagesPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { homeId } = await params;
  const userId = session.user.id;

  // Verify user owns this home
  const home = await prisma.home.findFirst({
    where: {
      id: homeId,
      ownerId: userId,
    },
  });

  if (!home) {
    redirect("/");
  }

  // Get all connections (both active and archived) for THIS home
  const connections = await prisma.connection.findMany({
    where: {
      homeId,
      homeownerId: userId,
      status: { in: ["ACTIVE", "ARCHIVED"] },
      contractorId: { not: null },
    },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: {
            select: {
              businessName: true,
            },
          },
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
          reads: {
            where: { userId },
          },
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              reads: {
                none: {
                  userId,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const addrLine = [home.address, home.city, home.state]
    .filter(Boolean)
    .join(", ");

  // Format and separate conversations
  const formatConversation = (conn: (typeof connections)[number]) => {
    const lastMessage = conn.messages[0];
    const unreadCount = conn._count.messages;
    const isArchived = conn.status === "ARCHIVED";

    return {
      connectionId: conn.id,
      contractor: {
        name:
          conn.contractor!.proProfile?.businessName ||
          conn.contractor!.name ||
          conn.contractor!.email ||
          "Contractor",
        image: conn.contractor!.image,
      },
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.reads.length > 0,
          }
        : null,
      unreadCount: isArchived ? 0 : unreadCount, // No unread for archived
      isArchived,
      archivedAt: conn.archivedAt,
    };
  };

  const allConversations = connections
    .filter((conn) => conn.contractor !== null)
    .map(formatConversation);

  const activeConversations = allConversations.filter((c) => !c.isArchived);
  const archivedConversations = allConversations.filter((c) => c.isArchived);

  // Sort: active by last message, archived by archivedAt
  activeConversations.sort((a, b) => {
    const aDate = a.lastMessage?.createdAt || new Date(0);
    const bDate = b.lastMessage?.createdAt || new Date(0);
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  archivedConversations.sort((a, b) => {
    const aDate = a.archivedAt || new Date(0);
    const bDate = b.archivedAt || new Date(0);
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const totalActiveUnread = activeConversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          href={`/home/${homeId}`}
          label={addrLine}
          current="Messages"
        />

        {/* Header */}
        <section className={glass}>
          <div className="flex items-center gap-3">
            <Link
              href={`/home/${homeId}`}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Back to home"
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

            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl font-bold ${heading}`}>Messages</h1>
              <p className={`mt-1 text-sm ${textMeta}`}>
                Conversations with contractors for this home.
              </p>
              <p className={`mt-1 text-xs ${textMeta}`}>
                {activeConversations.length}{" "}
                {activeConversations.length === 1
                  ? "conversation"
                  : "conversations"}
                {totalActiveUnread > 0 && (
                  <span className="ml-2 text-orange-400">
                    ({totalActiveUnread} unread)
                  </span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Conversations List */}
        <section className={glass}>
          {activeConversations.length === 0 &&
          archivedConversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
              <p className="mb-2 text-white/80">No conversations yet</p>
              <p className={`text-sm ${textMeta}`}>
                Messages will appear here when contractors reach out or when you
                start a conversation with a connected contractor.
              </p>
            </div>
          ) : (
            <MessagesListClient
              homeId={homeId}
              activeConversations={activeConversations}
              archivedConversations={archivedConversations}
            />
          )}
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