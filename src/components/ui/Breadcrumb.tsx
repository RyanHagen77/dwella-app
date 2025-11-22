// app/components/ui/Breadcrumb.tsx
export function Breadcrumb({
  href,
  label,
  current,
}: {
  href: string;
  label: string;
  current: string;
}) {
  return (
    <nav className="flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden">
      <a
        href={href}
        className="text-white/70 hover:text-white transition-colors truncate max-w-[55vw] sm:max-w-none"
      >
        {label}
      </a>

      <span className="text-white/50">/</span>

      <span className="text-white truncate max-w-[35vw] sm:max-w-none">
        {current}
      </span>
    </nav>
  );
}