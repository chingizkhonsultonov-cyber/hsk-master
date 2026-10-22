import type { Metadata } from "next";
import Link from "next/link";
import { OpenCue } from "@/components/OpenCue";
import { getDictionary, fmt, count } from "@/lib/i18n";
import { levelSummary } from "@/lib/data";
import { Crumbs } from "@/components/Crumbs";
import { LevelProgress } from "@/components/LevelProgress";
import { WritingCount } from "@/components/WritingCount";
import { Readiness } from "@/components/Readiness";
import type { Locale } from "@/lib/types";
import { levelName, levelNumber, levelSlug, parseLevel } from "@/lib/levels";

type P = { params: Promise<{ locale: Locale; level: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level: raw } = await params;
  const level = parseLevel(raw) ?? 1;
  return { title: fmt(getDictionary(locale).hub.title, { n: levelNumber(level) }) };
}

const MODULES = [
  { key: "lessons", glyph: "课" },
  { key: "listening", glyph: "听" },
  { key: "reading", glyph: "读" },
  { key: "writing", glyph: "写" },
  { key: "speaking", glyph: "说" },
  { key: "dialogues", glyph: "话" },
] as const;

export default async function LevelHub({ params }: P) {
  const { locale, level: raw } = await params;
  const level = parseLevel(raw)!;
  const slug = levelSlug(level);
  const t = getDictionary(locale);
  const s = levelSummary(level);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Crumbs items={[{ href: `/${locale}`, label: t.common.appName }, { label: levelName(level) }]} />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{fmt(t.hub.title, { n: levelNumber(level) })}</h1>
        <p className="text-muted">
          {fmt(t.hub.intro, { words: s.words.toLocaleString(locale), lessons: s.lessons })}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
          <span className="eyebrow">{t.hub.progressWords}</span>
          <LevelProgress level={level} total={s.words} />
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
          <span className="eyebrow">{t.hub.progressChars}</span>
          <WritingCount level={level} />
        </div>
      </div>
      <Readiness level={level} words={s.words} />
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          { href: "exam", glyph: "考", title: t.exam.hubTitle, body: t.exam.hubBody },
          { href: "practice", glyph: "练", title: t.practice.hubTitle, body: fmt(t.practice.hubBody, { n: s.words.toLocaleString(locale) }) },
        ] as const).map((c) => (
          <Link
            key={c.href}
            href={`/${locale}/hsk/${slug}/${c.href}`}
            className="group flex items-center gap-4 rounded-xl border border-accent/60 bg-surface p-5 transition-colors hover:border-accent"
          >
            <span aria-hidden="true" className="han grid h-14 w-14 shrink-0 place-items-center border-2 border-grid text-3xl text-accent">{c.glyph}</span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-lg font-semibold">{c.title}</span>
              <span className="text-sm text-muted">{c.body}</span>
              <OpenCue label={t.common.open} />
            </span>
          </Link>
        ))}
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {MODULES.map((m, i) => {
          const mod = t.hub.modules[m.key];
          return (
            <li key={m.key}>
              <Link
                href={`/${locale}/hsk/${slug}/${m.key}`}
                className="group flex h-full gap-4 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent"
              >
                <span aria-hidden="true" className="han grid h-14 w-14 shrink-0 place-items-center border-2 border-grid text-3xl group-hover:text-accent">
                  {m.glyph}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-muted tabular-nums">{i + 1}</span>
                    <span className="text-lg font-semibold">{mod.title}</span>
                  </span>
                  <span className="text-sm text-muted">{mod.body}</span>
                  {m.key === "lessons" && <span className="text-sm text-muted tabular-nums">{count(t.common.lessons, s.lessons, locale)}</span>}
                  <OpenCue label={t.common.open} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
