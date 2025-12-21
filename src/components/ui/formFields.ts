// src/components/ui/formFields.ts

/** Shared form field styling (Dwella standard)
 * - No rings
 * - White border idle
 * - Green border on focus (thicker)
 * - text-base on mobile to prevent iOS Safari auto-zoom
 */

export const formFieldShell =
  "rounded-2xl border border-white/20 bg-black/35 backdrop-blur transition-colors overflow-hidden " +
  "focus-within:border-[#33C17D] focus-within:border-2";

export const formControlReset =
  "border-0 ring-0 outline-none focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 " +
  "[-webkit-tap-highlight-color:transparent] " +
  "autofill:shadow-[0_0_0px_1000px_rgba(0,0,0,0.35)_inset] " +
  "autofill:[-webkit-text-fill-color:#fff]";

export const formFieldInnerBase =
  "w-full bg-transparent text-white placeholder:text-white/40 " +
  "text-base sm:text-sm " +
  formControlReset;

export const formInputInner = `${formFieldInnerBase} px-4 py-2.5`;

export const formTextareaInner =
  `${formFieldInnerBase} px-4 py-3 resize-none min-h-[140px]`;

export const formSelectInner =
  `${formFieldInnerBase} px-4 py-2.5 appearance-none pr-10`;

export const formLabelCaps =
  "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

export const formHelperText = "mt-2 text-sm text-white/60";

/** Inset “info surface” inside forms (not clickable, no hover) */
export const formSectionSurface =
  "rounded-2xl border border-white/15 bg-black/25 p-4";

/** Quiet “fog” pill button (for upload triggers, etc.) */
export const formQuietButton =
  "inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 " +
  "transition-colors hover:bg-white/15 " +
  "disabled:cursor-not-allowed disabled:opacity-50";