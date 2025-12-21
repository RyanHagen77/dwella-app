// src/components/ui/listPrimitives.ts

/** List / tabs / card primitives (Dwella standard)
 * - No big-container hover slabs
 * - Darker surfaces (avoid washed “white fog”)
 * - Keep styles centralized (no ad-hoc pills/cards per page)
 */

export const tabsRow = "flex flex-wrap gap-2";

export const tabPillBase = "rounded-full border px-4 py-2 text-sm";
export const tabPillActive = "border-white/25 bg-black/35 text-white";
export const tabPillIdle = "border-white/15 bg-black/20 text-white/80";

export const filterPillBase = "rounded-full border px-3 py-1 text-xs sm:text-sm";
export const filterPillActive = "border-white/25 bg-black/35 text-white";
export const filterPillIdle = "border-white/15 bg-black/20 text-white/70";

export const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";
export const cardLink = `${cardSurface} block`; // intentionally no hover
export const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

export const sectionTitle = "mb-3 text-sm font-semibold text-white/85";
export const sectionCount = "text-white/45";