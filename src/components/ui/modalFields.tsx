// src/components/ui/modalFields.ts

/** Shared modal field styling (Dwella standard)
 * - No rings
 * - White border idle
 * - Green border on focus (thicker)
 * - text-base on mobile to prevent iOS Safari auto-zoom
 */

export const modalFieldShell =
  "rounded-2xl border border-white/20 bg-black/35 backdrop-blur transition-colors overflow-hidden " +
  "focus-within:border-[#33C17D] focus-within:border-2";

export const modalFieldInnerBase =
  "w-full bg-transparent text-white outline-none placeholder:text-white/35 " +
  "border-0 ring-0 focus:ring-0 focus:outline-none " +
  "text-base sm:text-sm";

export const modalInputInner = `${modalFieldInnerBase} px-4 py-2`;

export const modalTextareaInner =
  `${modalFieldInnerBase} px-[15px] py-[11px] resize-none min-h-[110px]`;

export const modalSelectInner =
  `${modalFieldInnerBase} px-4 py-2 appearance-none pr-10`;

export const modalLabelCaps =
  "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";