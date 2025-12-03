import type { HomeVerificationStatus } from "@prisma/client";

type Props = {
  status: HomeVerificationStatus;
};

export function HomeVerificationBadge({ status }: Props) {
  let label = "";
  let classes = "bg-white/5 text-white/70 border border-white/10";

  if (status === "VERIFIED_BY_POSTCARD") {
    label = "Verified Owner ✔";
    classes = "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40";
  } else if (status === "VERIFIED_BY_VENDOR") {
    label = "Verified by Contractor ✔";
    classes = "bg-sky-500/15 text-sky-300 border border-sky-500/40";
  } else {
    label = "Verification Pending";
    classes = "bg-amber-500/10 text-amber-300 border border-amber-500/40";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}