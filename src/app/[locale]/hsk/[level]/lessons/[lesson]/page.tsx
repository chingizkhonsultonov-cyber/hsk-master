import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDictionary, fmt } from "@/lib/i18n";
import { getLesson, getLevel, lessonCount } from "@/lib/data";
import { Crumbs } from "@/components/Crumbs";
import { LessonClient } from "@/components/lesson/LessonClient";
import { lessonExamples } from "@/lib/examples";
import { LessonLinks } from "@/components/LessonLinks";
import type { Locale } from "@/lib/types";
import { LEVEL_NUMBERS, levelName, levelSlug, parseLevel } from "@/lib/levels";

type P = { params: Promise<{ locale: Locale; level: string; lesson: string }> };

export function generateStaticParams({ params }: { params: { level: string } }) {
  const levels = params?.level ? [parseLevel(params.level)!] : [...LEVEL_NUMBERS];
  return levels.flatMap((l) => Array.from({ length: lessonCount(l) }, (_, i) => ({ level: levelSlug(l), lesson: String(i + 1) })));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level: raw, lesson } = await params;
  const level = parseLevel(raw) ?? 1;
  const t = getDictionary(locale);
  return { title: `${levelName(level)} · ${fmt(t.common.lesson, { n: lesson })}` };
}

export default async function LessonPage({ params }: P) {
  const { locale, level: rawLevel, lesson: rawLesson } = await params;
  const level = parseLevel(rawLevel)!;
  const slug = levelSlug(level);
  const lesson = Number(rawLesson);
  const total = lessonCount(level);
  if (!Number.isInteger(lesson) || lesson < 1 || lesson > total) notFound();
  const t = getDictionary(locale);
  const words = getLesson(level, lesson);
  // Distractors for the test come from neighbouring lessons of the same level.
  const pool = getLevel(level)
    .filter((w) => w.lesson !== lesson && Math.abs(w.lesson - lesson) <= 3)
    .slice(0, 80)
    .map(({ id, h, p, en, ru }) => ({ id, h, p, en, ru }));
  const examples = lessonExamples(level, words);
  const all = getLevel(level);
  const previews = Array.from({ length: total }, (_, i) => all.filter((w) => w.lesson === i + 1).slice(0, 3).map((w) => w.h).join("、"));
  const base = `/${locale}/hsk/${slug}/lessons`;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Crumbs
          items={[
            { href: `/${locale}`, label: t.common.appName },
            { href: `/${locale}/hsk/${slug}`, label: levelName(level) },
            { href: base, label: t.hub.modules.lessons.title },
            { label: fmt(t.common.lesson, { n: lesson }) },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">
          {levelName(level)} · {fmt(t.common.lesson, { n: lesson })}
        </h1>
      </div>
      <nav aria-label={t.lesson.jump}>
        <details open={total <= 30} className="group">
        <summary className="eyebrow cursor-pointer select-none">{t.lesson.jump} · {total}</summary>
        <div className="mt-2">
          <LessonLinks base={base} level={level} previews={previews} compact current={lesson} />
        </div>
        </details>
      </nav>
      <LessonClient words={words} pool={pool} examples={examples} testKey={`3-${level}-L${lesson}`} />
      <nav className="flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-sm font-semibold" aria-label={t.hub.modules.lessons.title}>
        {lesson > 1 ? <Link className="text-accent hover:underline" href={`${base}/${lesson - 1}`}>← {t.lesson.prev}</Link> : <span />}
        {lesson < total && <Link className="text-accent hover:underline" href={`${base}/${lesson + 1}`}>{t.lesson.next} →</Link>}
      </nav>
    </div>
  );
}
