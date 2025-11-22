/**
 * HOMEOWNER INDIVIDUAL CHAT PAGE
 *
 * Real-time messaging interface for homeowner chatting with a contractor.
 * Shows message history and allows sending new messages.
 *
 * Location: app/home/[homeId]/messages/[connectionId]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";
import { MessageThread } from "@/app/pro/messages/[connectionId]/_components/MessageThread";
import ChatBreadcrumb from "@/components/ui/ChatBreadcrumb";

export default async function HomeownerChatPage({
  params,
}: {
  params: Promise<{ homeId: string; connectionId: string }>;
}) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { homeId, connectionId } = await params;
  const userId = session.user.id;

  // Get connection details - verify homeowner owns this home and connection
  const connection = await prisma.connection.findFirst({
    where: {
      id: connectionId,
      homeId,
      homeownerId: userId,
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
    },
  });

  if (!connection || !connection.contractor) {
    notFound();
  }

  // Get messages
  const messages = await prisma.message.findMany({
    where: { connectionId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      attachments: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          url: true,
        },
      },
      reads: {
        where: { userId },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const otherUser = {
    id: connection.contractor.id,
    name:
      connection.contractor.proProfile?.businessName ||
      connection.contractor.name ||
      connection.contractor.email ||
      "Contractor",
    image: connection.contractor.image,
  };

  const property = {
    address: connection.home.address,
    city: connection.home.city,
    state: connection.home.state,
  };

  const addrLine = [property.address, property.city, property.state]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Breadcrumb */}
        <ChatBreadcrumb
          homeId={homeId}
          homeAddress={addrLine}         // already exists
          otherUserName={otherUser.name} // already exists
        />

        {/* Header w/ back arrow + contractor info */}
        <section className={glass}>
          <div className="flex items-center gap-3">
            <Link
              href={`/home/${homeId}/messages`}
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
              {addrLine && (
                <p className={`text-sm ${textMeta} truncate`}>{addrLine}</p>
              )}
            </div>
          </div>
        </section>

        {/* Messages thread */}
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