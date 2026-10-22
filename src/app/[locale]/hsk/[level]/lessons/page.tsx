import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, fmt, count } from "@/lib/i18n";
import { getLevel, lessonCount } from "@/lib/data";
import { explainedCount, getSyllabusGrammar } from "@/data/grammar";
import { Crumbs } from "@/components/Crumbs";
import { LessonTile } from "@/components/LessonTile";
import type { Locale } from "@/lib/types";
import { levelName, levelNumber, levelSlug, parseLevel } from "@/lib/levels";

type P = { params: Promise<{ locale: Locale; level: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level: raw } = await params;
  const level = parseLevel(raw) ?? 1;
  return { title: fmt(getDictionary(locale).lessons.title, { n: levelNumber(level) }) };
}

export default async function Lessons({ params }: P) {
  const { locale, level: raw } = await params;
  const level = parseLevel(raw)!;
  const slug = levelSlug(level);
  const t = getDictionary(locale);
  const words = getLevel(level);
  const n = lessonCount(level);
  const syllabusGrammar = getSyllabusGrammar(level);
  const lessons = Array.from({ length: n }, (_, i) => {
    const ws = words.filter((w) => w.lesson === i + 1);
    return { n: i + 1, preview: ws.slice(0, 4).map((w) => w.h).join("、"), ids: ws.map((w) => w.id), size: ws.length };
  });
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Crumbs items={[{ href: `/${locale}`, label: t.common.appName }, { href: `/${locale}/hsk/${slug}`, label: levelName(level) }, { label: t.hub.modules.lessons.title }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{fmt(t.lessons.title, { n: levelNumber(level) })}</h1>
        <p className="max-w-2xl text-muted">{t.lessons.intro}</p>
      </div>
      <Link href={`/${locale}/hsk/${slug}/grammar`} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5 hover:border-accent">
        <span className="flex flex-col gap-1">
          <span className="text-lg font-semibold">{t.lessons.grammar}</span>
          <span className="text-sm text-muted">{fmt(t.grammar.counts, { n: syllabusGrammar.length, m: explainedCount(level) })}</span>
        </span>
        <span aria-hidden="true" className="han text-3xl text-muted">语法</span>
      </Link>
      <Link href={`/${locale}/hsk/${slug}/practice`} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5 hover:border-accent">
        <span className="flex flex-col gap-1">
          <span className="text-lg font-semibold">{t.practice.hubTitle}</span>
          <span className="text-sm text-muted">{fmt(t.practice.hubBody, { n: words.length.toLocaleString(locale) })}</span>
        </span>
        <span aria-hidden="true" className="han text-3xl text-muted">练习</span>
      </Link>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => (
          <li key={l.n}>
            <LessonTile
              href={`/${locale}/hsk/${slug}/lessons/${l.n}`}
              title={fmt(t.common.lesson, { n: l.n })}
              sub={count(t.common.words, l.size, locale)}
              preview={l.preview}
              ids={l.ids}
              testKey={`3-${level}-L${l.n}`}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
