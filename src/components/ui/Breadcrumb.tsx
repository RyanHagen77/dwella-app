// app/components/ui/Breadcrumb.tsx

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  href?: string;        // old API
  label?: string;       // old API
  current?: string;     // old API
  items?: Crumb[];      // new API
}

export default function Breadcrumb(props: Props) {
  // SUPPORT OLD API
  const legacyItems =
    props.href && props.label && props.current
      ? [
          { label: props.label, href: props.href },
          { label: props.current },
        ]
      : null;

  // NEW API TAKES PRIORITY IF PROVIDED
  const items = props.items ?? legacyItems;

  if (!items) return null;

  return (
    <nav className="flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;

        return (
          <div key={i} className="flex items-center gap-2 min-w-0">
            {item.href && !isLast ? (
              <a
                href={item.href}
                className="text-white/70 hover:text-white transition-colors truncate"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-white truncate">{item.label}</span>
            )}

            {!isLast && <span className="text-white/50">/</span>}
          </div>
        );
      })}
    </nav>
  );
}