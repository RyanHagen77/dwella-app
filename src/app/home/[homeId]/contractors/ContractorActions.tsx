"use client";

import { useState } from "react";
import { ctaPrimary } from "@/lib/glass";
import { InviteProModal } from "@/app/home/[homeId]/invitations/InviteProModal";

type ContractorActionsProps = {
  homeId: string;
  homeAddress: string;
  showInviteButton?: boolean;
};

export function ContractorActions({ homeId, homeAddress, showInviteButton }: ContractorActionsProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setInviteModalOpen(true)}
        className={`${ctaPrimary} text-sm`}
      >
        + Invite a Pro
      </button>

      <InviteProModal
        open={inviteModalOpen}
        onCloseAction={() => setInviteModalOpen(false)}
        homeId={homeId}
        homeAddress={homeAddress}
      />
    </>
  );
}