import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, fmt, count } from "@/lib/i18n";
import { getLevel, lessonCount } from "@/lib/data";
import { getGrammar } from "@/data/grammar";
import { Crumbs } from "@/components/Crumbs";
import { LessonTile } from "@/components/LessonTile";
import type { Locale } from "@/lib/types";

type P = { params: Promise<{ locale: Locale; level: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level } = await params;
  return { title: fmt(getDictionary(locale).lessons.title, { n: level }) };
}

export default async function Lessons({ params }: P) {
  const { locale, level: raw } = await params;
  const level = Number(raw);
  const t = getDictionary(locale);
  const words = getLevel(level);
  const n = lessonCount(level);
  const grammar = getGrammar(level);
  const lessons = Array.from({ length: n }, (_, i) => {
    const ws = words.filter((w) => w.lesson === i + 1);
    return { n: i + 1, preview: ws.slice(0, 4).map((w) => w.h).join("、"), ids: ws.map((w) => w.id), size: ws.length };
  });
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Crumbs items={[{ href: `/${locale}`, label: t.common.appName }, { href: `/${locale}/hsk/${level}`, label: fmt(t.common.level, { n: level }) }, { label: t.hub.modules.lessons.title }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{fmt(t.lessons.title, { n: level })}</h1>
        <p className="max-w-2xl text-muted">{t.lessons.intro}</p>
      </div>
      <Link href={`/${locale}/hsk/${level}/grammar`} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5 hover:border-accent">
        <span className="flex flex-col gap-1">
          <span className="text-lg font-semibold">{t.lessons.grammar}</span>
          <span className="text-sm text-muted">{grammar.length ? fmt(t.lessons.grammarCount, { n: grammar.length }) : t.lessons.grammarPending}</span>
        </span>
        <span aria-hidden="true" className="han text-3xl text-muted">语法</span>
      </Link>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => (
          <li key={l.n}>
            <LessonTile
              href={`/${locale}/hsk/${level}/lessons/${l.n}`}
              title={fmt(t.common.lesson, { n: l.n })}
              sub={count(t.common.words, l.size, locale)}
              preview={l.preview}
              ids={l.ids}
              testKey={`2-${level}-L${l.n}`}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
