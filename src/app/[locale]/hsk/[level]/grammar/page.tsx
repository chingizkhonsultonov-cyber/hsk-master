import type { Metadata } from "next";
import { getDictionary, fmt } from "@/lib/i18n";
import { getGrammar } from "@/data/grammar";
import { Crumbs } from "@/components/Crumbs";
import type { Locale } from "@/lib/types";

type P = { params: Promise<{ locale: Locale; level: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level } = await params;
  return { title: fmt(getDictionary(locale).grammar.title, { n: level }) };
}

export default async function Grammar({ params }: P) {
  const { locale, level: raw } = await params;
  const level = Number(raw);
  const t = getDictionary(locale);
  const points = getGrammar(level);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Crumbs items={[{ href: `/${locale}`, label: t.common.appName }, { href: `/${locale}/hsk/${level}`, label: fmt(t.common.level, { n: level }) }, { href: `/${locale}/hsk/${level}/lessons`, label: t.hub.modules.lessons.title }, { label: t.lessons.grammar }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{fmt(t.grammar.title, { n: level })}</h1>
        <p className="max-w-2xl text-muted">{points.length ? t.grammar.intro : t.lessons.grammarPending}</p>
      </div>
      {points.length > 0 && (
        <nav aria-label={t.lessons.grammar} className="flex flex-wrap gap-2">
          {points.map((g, i) => (
            <a key={g.id} href={`#${g.id}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-accent">
              <span className="text-muted tabular-nums">{i + 1}.</span> <span lang="zh-CN" className="han">{g.title.zh}</span>
            </a>
          ))}
        </nav>
      )}
      <ol className="flex flex-col gap-5">
        {points.map((g, i) => (
          <li key={g.id} id={g.id} className="scroll-mt-24">
            <article className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6">
              <header className="flex flex-col gap-1">
                <span className="text-sm text-muted tabular-nums">
                  {i + 1} · <span lang="zh-CN" className="han">{g.title.zh}</span>
                </span>
                <h2 className="text-xl font-semibold">{g.title[locale]}</h2>
              </header>
              <div className="flex flex-col gap-1">
                <span className="eyebrow">{t.grammar.structure}</span>
                <p lang="zh-CN" className="han overflow-x-auto rounded-lg bg-paper px-3 py-2 text-lg">{g.structure}</p>
              </div>
              <p className="max-w-[65ch] leading-relaxed">{g.explain[locale]}</p>
              <div className="flex flex-col gap-2">
                <span className="eyebrow">{t.grammar.examples}</span>
                <ul className="flex flex-col gap-3">
                  {g.examples.map((ex) => (
                    <li key={ex.zh} className="flex flex-col border-l-2 border-line pl-3">
                      <span lang="zh-CN" className="han text-xl">{ex.zh}</span>
                      <span lang="zh-Latn-pinyin" className="text-sm text-muted">{ex.py}</span>
                      <span className="text-sm">{ex[locale]}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {g.warning && (
                <p className="rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-sm">
                  <strong className="font-semibold text-danger">{t.grammar.warning}:</strong> {g.warning[locale]}
                </p>
              )}
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
