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
import { glass, heading, textMeta } from "@/lib/glass";
import { MessagesList } from "./_components/MessagesList";

export default async function MessagesPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  if (!session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get all active connections with messages data (works for all pro types)
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

  // Format conversations
  const conversations = connections.map((conn) => {
    const lastMessage = conn.messages[0];
    const unreadCount = conn._count.messages;

    return {
      connectionId: conn.id,
      homeowner: {
        name: conn.homeowner.name || conn.homeowner.email || "Homeowner",
        image: conn.homeowner.image,
      },
      property: {
        address: conn.home.address,
        city: conn.home.city,
        state: conn.home.state,
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

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Header */}
        <section className={glass}>
          <h1 className={`text-2xl font-semibold ${heading}`}>Messages</h1>
          <p className={textMeta}>
            Communicate with homeowners about your work
          </p>
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