/** Shared page + card surfaces (Dwella standard)
 * - Avoid stacked glass (washed out look)
 * - Use calm dark surfaces for content sections
 * - No forced hover on whole cards unless explicitly wanted
 */

export const pageWrap = "mx-auto max-w-7xl space-y-6 p-6";
export const pageWrapNarrow = "mx-auto max-w-4xl space-y-6 p-6";

export const surface =
  "rounded-2xl border border-white/15 bg-black/35 p-6";

export const surfaceTight =
  "rounded-2xl border border-white/15 bg-black/35 p-4";

export const insetSurface =
  "rounded-2xl border border-white/15 bg-black/25 p-4";

export const card =
  "rounded-2xl border border-white/15 bg-black/25 p-5";

export const cardInteractive =
  "rounded-2xl border border-white/15 bg-black/25 p-5 transition-colors hover:bg-black/30";

export const divider = "h-px bg-white/10";

/** Tabs / pills */
export const pillBase = "rounded-full border px-4 py-2 text-sm transition-colors";
export const pillActive = "border-white/30 bg-white/15 text-white";
export const pillInactive = "border-white/15 bg-white/10 text-white/80 hover:bg-white/15";

/** Filter pills (smaller) */
export const filterPillBase = "rounded-full border px-3 py-1 text-xs transition-colors sm:text-sm";
export const filterPillActive = "border-white/30 bg-white/15 text-white";
export const filterPillInactive = "border-white/15 bg-white/10 text-white/70 hover:bg-white/15";