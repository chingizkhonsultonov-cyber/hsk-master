import type { Metadata } from "next";
import { getDictionary, fmt } from "@/lib/i18n";
import { Crumbs } from "@/components/Crumbs";
import type { Locale } from "@/lib/types";

type P = { params: Promise<{ locale: Locale; level: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level } = await params;
  return { title: fmt(getDictionary(locale).listening.title, { n: level }) };
}

export default async function Listening({ params }: P) {
  const { locale, level: raw } = await params;
  const level = Number(raw);
  const t = getDictionary(locale);
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Crumbs items={[{ href: `/${locale}`, label: t.common.appName }, { href: `/${locale}/hsk/${level}`, label: fmt(t.common.level, { n: level }) }, { label: t.hub.modules.listening.title }]} />
      <h1 className="text-3xl font-semibold tracking-tight">{fmt(t.listening.title, { n: level })}</h1>
      <span className="self-start rounded-full border border-line px-3 py-1 text-sm text-muted">{t.common.inDevelopment}</span>
      <p>{fmt(t.listening.body, { n: level })}</p>
      <ol className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
        {t.listening.formats[level].map((f, i) => (
          <li key={f} className="flex gap-3 px-4 py-3">
            <span className="text-muted tabular-nums">{i + 1}</span>
            {f}
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">{t.listening.note}</p>
    </div>
  );
}
