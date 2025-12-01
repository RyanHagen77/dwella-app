// /lib/glass.ts
// Tailwind tokens for light-on-dark "glass" UI

export const panelBase =
  "rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,.25)] transition hover:bg-white/15";

export const glass = `${panelBase} p-4`;
export const glassTight = `${panelBase} p-3`;

export const heading =
  "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]";
export const textBody = "text-white/85";
export const textMeta = "text-white/70";

export const focusRing =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-white/60 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-black/40";

export const ctaPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 " +
  "text-sm font-medium text-white border border-white/30 " +
  "bg-[rgba(243,90,31,0.85)] hover:bg-[rgba(243,90,31,0.95)] " +
  "shadow-[0_8px_24px_rgba(243,90,31,.25)] " +
  `${focusRing}`;

export const ctaDanger = "inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/30";

export const ctaGhost =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 " +
  "text-sm font-medium text-white border border-white/40 bg-white/10 hover:bg-white/20 " +
  `${focusRing}`;

// --- Universal field tokens ---
export const fieldBase =
  "block w-full rounded-xl px-3 py-2 outline-none transition-colors " +
  "placeholder:text-slate-500/80 shadow-sm";

export const fieldDisabled = "disabled:opacity-60 disabled:cursor-not-allowed";

// For inputs sitting on GLASS/LIGHT cards (your common case)
export const fieldOnGlass =
  "bg-white/95 text-slate-900 border border-white/20 " +            // readable text; subtle border
  "hover:border-white/30 " +
  "focus:border-white/50 focus:ring-2 focus:ring-white/40";          // soft white ring, not orange

// For inputs on DARK overlays/hero photos (rare, but handy)
export const fieldOnDark =
  "bg-white/10 text-white border border-white/25 " +                 // translucent, high-contrast text
  "hover:border-white/40 " +
  "focus:ring-2 focus:ring-sky-300/40";                              // cool focus ring (no orange)

// Default export most pages should use:
export const fieldInput = [fieldBase, fieldOnGlass, fieldDisabled].join(" ");

// Optional variants (useful to be explicit)
export const fieldInputOnGlass = [fieldBase, fieldOnGlass, fieldDisabled].join(" ");
export const fieldInputOnDark  = [fieldBase, fieldOnDark,  fieldDisabled].join(" ");

// Common friends
export const fieldLabel = "mb-1 block text-sm font-medium text-white/90";
export const fieldHelp  = "mt-1 text-xs text-white/70";

// Table container for dark glass
export const tableGlass = `${panelBase} overflow-hidden`;

