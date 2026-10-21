import type { Metadata } from "next";
import { getDictionary, fmt } from "@/lib/i18n";
import { getGrammar, getSyllabusGrammar } from "@/data/grammar";
import { grammarLabel } from "@/data/grammar/labels";
import { Crumbs } from "@/components/Crumbs";
import type { Locale } from "@/lib/types";
import { levelName, levelNumber, levelSlug, parseLevel } from "@/lib/levels";

type P = { params: Promise<{ locale: Locale; level: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level: raw } = await params;
  const level = parseLevel(raw) ?? 1;
  return { title: fmt(getDictionary(locale).grammar.title, { n: levelNumber(level) }) };
}

export default async function Grammar({ params }: P) {
  const { locale, level: raw } = await params;
  const level = parseLevel(raw)!;
  const slug = levelSlug(level);
  const t = getDictionary(locale);
  const points = getGrammar(level);
  const syllabus = getSyllabusGrammar(level);
  const groups: { c: string; items: typeof syllabus }[] = [];
  for (const it of syllabus) {
    const g = groups[groups.length - 1];
    if (g && g.c === it.c) g.items.push(it);
    else groups.push({ c: it.c, items: [it] });
  }
  const label = (zh: string) => grammarLabel(zh, locale);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Crumbs items={[{ href: `/${locale}`, label: t.common.appName }, { href: `/${locale}/hsk/${slug}`, label: levelName(level) }, { href: `/${locale}/hsk/${slug}/lessons`, label: t.hub.modules.lessons.title }, { label: t.lessons.grammar }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{fmt(t.grammar.title, { n: levelNumber(level) })}</h1>
        <p className="max-w-2xl text-muted">{t.grammar.intro}</p>
        <p className="text-sm text-muted">
          {fmt(t.grammar.counts, { n: syllabus.length, m: points.length })}
        </p>
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
      <section aria-labelledby="syllabus-h" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="syllabus-h" className="text-2xl font-semibold">{t.grammar.syllabusTitle}</h2>
          <p className="max-w-2xl text-sm text-muted">{t.grammar.syllabusIntro}</p>
        </div>
        {groups.map((g) => (
          <details key={g.c} open={level <= 2} className="rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 px-5 py-4 font-semibold">
              <span>{label(g.c) ?? g.c}</span>
              <span lang="zh-CN" className="han text-sm font-normal text-muted">{g.c}</span>
              <span className="ml-auto text-sm font-normal text-muted tabular-nums">{g.items.length}</span>
            </summary>
            <ul className="divide-y divide-line border-t border-line">
              {g.items.map((it, i) => (
                <li key={i} className="grid gap-1 px-5 py-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:gap-4">
                  <span className="flex flex-col text-sm">
                    {[it.n, it.s].filter(Boolean).map((x) => (
                      <span key={x}>
                        {label(x) ?? x} <span lang="zh-CN" className="han text-muted">{x}</span>
                      </span>
                    ))}
                  </span>
                  <span lang="zh-CN" className="han min-w-0 break-words">{it.v || "—"}</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
    </div>
  );
}
