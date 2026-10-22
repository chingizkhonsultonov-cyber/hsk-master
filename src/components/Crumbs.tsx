import Link from "next/link";
import { BackButton } from "./BackButton";

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  const parent = items.findLast((it) => it.href)?.href;
  return (
    <div className="flex flex-col items-start gap-3">
      {parent && <BackButton parent={parent} />}
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {it.href ? (
                <Link href={it.href} className="hover:text-ink hover:underline">
                  {it.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink">
                  {it.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
