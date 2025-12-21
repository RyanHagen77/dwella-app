// src/components/ui/foggyButtons.ts

/** Foggy action buttons (Dwella standard)
 * - Soft, translucent “fog” fills
 * - No harsh gradients
 * - Rounded-full to match app tone
 */

export const foggyApprove =
  "rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium " +
  "text-emerald-100 transition-colors hover:bg-emerald-400/15 hover:border-emerald-300/35 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const foggyReject =
  "rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-medium " +
  "text-red-100 transition-colors hover:bg-red-400/15 hover:border-red-300/35 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const foggyNeutral =
  "rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium " +
  "text-white/90 transition-colors hover:bg-white/15 hover:border-white/30 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";