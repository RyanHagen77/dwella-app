/**
 * HOMEOWNER MESSAGES INBOX PAGE
 *
 * Shows all conversations with contractors for THIS specific home.
 * Lists connections with unread counts and last message preview.
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
import { formatDistanceToNow } from "date-fns";
import { glass, glassTight, heading, textMeta } from "@/lib/glass";
import Breadcrumb from "@/components/ui/Breadcrumb";

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

  // Get all active connections for THIS home
  const connections = await prisma.connection.findMany({
    where: {
      homeId,
      homeownerId: userId,
      status: "ACTIVE",
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

  // Format conversations
  const conversations = connections
    .filter((conn) => conn.contractor !== null)
    .map((conn) => {
      const lastMessage = conn.messages[0];
      const unreadCount = conn._count.messages;

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

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          href={`/home/${homeId}`}
          label={addrLine}       // already exists, no new var needed
          current="Messages"        // or Maintenance & Repairs, etc.
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
                {conversations.length}{" "}
                {conversations.length === 1 ? "conversation" : "conversations"}
              </p>
            </div>
          </div>
        </section>

        {/* Conversations List */}
        <section className={glass}>
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
              <p className="mb-2 text-white/80">No conversations yet</p>
              <p className={`text-sm ${textMeta}`}>
                Messages will appear here when contractors reach out or when you
                start a conversation with a connected contractor.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <Link
                  key={conv.connectionId}
                  href={`/home/${homeId}/messages/${conv.connectionId}`}
                  className={`${glassTight} flex items-center gap-4 hover:bg-white/10 transition-colors`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {conv.contractor.image ? (
                      <Image
                        src={conv.contractor.image}
                        alt={conv.contractor.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-xl font-medium">
                          {conv.contractor.name[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-medium text-white truncate">
                        {conv.contractor.name}
                      </p>
                      {conv.lastMessage && (
                        <p className={`text-xs ${textMeta} flex-shrink-0`}>
                          {formatDistanceToNow(
                            new Date(conv.lastMessage.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p
                        className={`mt-1 truncate text-sm ${
                          conv.unreadCount > 0
                            ? "text-white font-medium"
                            : textMeta
                        }`}
                      >
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <div className="flex-shrink-0 h-6 min-w-[24px] px-1.5 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
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