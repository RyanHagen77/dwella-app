// app/home/[homeId]/contractors/ContractorActions.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InviteProModal } from "@/app/home/[homeId]/invitations/_components/InviteProModal";

type ContractorActionsProps = {
  homeId: string;
  homeAddress: string;
};

export function ContractorActions({ homeId, homeAddress }: ContractorActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteOpen = searchParams?.get("invite") === "1";

  function openInvite() {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("invite", "1");
    router.replace(`/home/${homeId}/contractors?${params.toString()}`, { scroll: false });
  }

  function closeInvite() {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("invite");
    const qs = params.toString();
    router.replace(`/home/${homeId}/contractors${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  // ✅ fix “background off the sides” after closing (scrollbar/padding lock residue)
  useEffect(() => {
    if (!inviteOpen) {
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      return;
    }

    // lock scrolling while modal open
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [inviteOpen]);

  return (
    <>
      <button
        type="button"
        onClick={openInvite}
        className="text-xs text-indigo-300 hover:text-indigo-200"
      >
        Invite Pro
      </button>

      <InviteProModal
        open={inviteOpen}
        onCloseAction={closeInvite}
        homeId={homeId}
        homeAddress={homeAddress}
      />
    </>
  );
}