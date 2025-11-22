"use client";

import Link from "next/link";

type Props = {
  homeId: string;
  homeAddress: string;
  otherUserName: string;
};

export default function ChatBreadcrumb({
  homeId,
  homeAddress,
  otherUserName,
}: Props) {
  return (
    <nav className="flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden">
      <Link
        href={`/home/${homeId}`}
        className="text-white/70 hover:text-white transition-colors truncate max-w-[45vw] sm:max-w-none"
      >
        {homeAddress || "Home"}
      </Link>

      <span className="text-white/50 flex-shrink-0">/</span>

      <Link
        href={`/home/${homeId}/messages`}
        className="text-white/70 hover:text-white transition-colors flex-shrink-0"
      >
        Messages
      </Link>

      <span className="text-white/50 flex-shrink-0">/</span>

      <span className="text-white truncate max-w-[30vw] sm:max-w-none">
        {otherUserName}
      </span>
    </nav>
  );
}