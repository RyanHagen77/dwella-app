"use client";

import { useState } from "react";
import { ctaGhost } from "@/lib/glass";
import { ContractorInvitationModal } from "@/app/pro/contractor/invitations/ContractorInvitationModal";

export function InviteHomeownerButton({
  className,
  variant = "button"
}: {
  className?: string;
  variant?: "button" | "link";
}) {
  const [isOpen, setIsOpen] = useState(false);

  const buttonClass = variant === "link"
    ? className || "text-sm text-white/70 hover:text-white"
    : className || ctaGhost;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={buttonClass}
      >
        {variant === "link" ? "Send another invite →" : "Invite Homeowner"}
      </button>

      <ContractorInvitationModal
        open={isOpen}
        onCloseAction={() => setIsOpen(false)}
      />
    </>
  );
}