"use client";

import { useState } from "react";
import { ctaPrimary } from "@/lib/glass";
import { InviteProModal } from "@/app/home/[homeId]/invitations/_components/InviteProModal";

type ContractorActionsProps = {
  homeId: string;
  homeAddress: string;
};

export function ContractorActions({ homeId, homeAddress }: ContractorActionsProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
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