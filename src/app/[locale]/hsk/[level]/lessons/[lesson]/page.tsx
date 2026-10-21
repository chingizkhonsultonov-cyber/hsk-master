import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDictionary, fmt } from "@/lib/i18n";
import { LEVEL_NUMBERS, getLesson, getLevel, lessonCount } from "@/lib/data";
import { Crumbs } from "@/components/Crumbs";
import { LessonClient } from "@/components/lesson/LessonClient";
import type { Locale } from "@/lib/types";

type P = { params: Promise<{ locale: Locale; level: string; lesson: string }> };

export function generateStaticParams({ params }: { params: { level: string } }) {
  const levels = params?.level ? [Number(params.level)] : [...LEVEL_NUMBERS];
  return levels.flatMap((l) => Array.from({ length: lessonCount(l) }, (_, i) => ({ level: String(l), lesson: String(i + 1) })));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level, lesson } = await params;
  const t = getDictionary(locale);
  return { title: `${fmt(t.common.level, { n: level })} · ${fmt(t.common.lesson, { n: lesson })}` };
}

export default async function LessonPage({ params }: P) {
  const { locale, level: rawLevel, lesson: rawLesson } = await params;
  const level = Number(rawLevel);
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
  const base = `/${locale}/hsk/${level}/lessons`;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Crumbs
          items={[
            { href: `/${locale}`, label: t.common.appName },
            { href: `/${locale}/hsk/${level}`, label: fmt(t.common.level, { n: level }) },
            { href: base, label: t.hub.modules.lessons.title },
            { label: fmt(t.common.lesson, { n: lesson }) },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">
          {fmt(t.common.level, { n: level })} · {fmt(t.common.lesson, { n: lesson })}
        </h1>
      </div>
      <LessonClient words={words} pool={pool} testKey={`2-${level}-L${lesson}`} />
      <nav className="flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-sm font-semibold" aria-label={t.hub.modules.lessons.title}>
        {lesson > 1 ? <Link className="text-accent hover:underline" href={`${base}/${lesson - 1}`}>← {t.lesson.prev}</Link> : <span />}
        {lesson < total && <Link className="text-accent hover:underline" href={`${base}/${lesson + 1}`}>{t.lesson.next} →</Link>}
      </nav>
    </div>
  );
}
