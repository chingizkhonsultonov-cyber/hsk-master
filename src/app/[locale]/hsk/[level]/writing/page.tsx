import type { Metadata } from "next";
import { getDictionary, fmt } from "@/lib/i18n";
import { getLevel, lessonCount } from "@/lib/data";
import { Crumbs } from "@/components/Crumbs";
import { WritingClient, type CharEntry } from "@/components/writing/WritingClient";
import { alignHanzi } from "@/lib/pinyin";
import type { Locale } from "@/lib/types";

type P = { params: Promise<{ locale: Locale; level: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level } = await params;
  return { title: fmt(getDictionary(locale).writing.title, { n: level }) };
}

export default async function Writing({ params }: P) {
  const { locale, level: raw } = await params;
  const level = Number(raw);
  const t = getDictionary(locale);
  // Each character once, with the first lesson word that teaches it.
  const seen = new Set<string>();
  const chars: CharEntry[] = [];
  for (const w of getLevel(level)) {
    for (const c of alignHanzi(w.h, w.p)) {
      if (seen.has(c.ch) || !/[一-鿿]/.test(c.ch)) continue;
      seen.add(c.ch);
      chars.push({ c: c.ch, s: c.syl ?? w.p, l: w.lesson, w: w.h, wp: w.p, m: (locale === "ru" && w.ru.length ? w.ru : w.en)[0] ?? "" });
    }
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Crumbs items={[{ href: `/${locale}`, label: t.common.appName }, { href: `/${locale}/hsk/${level}`, label: fmt(t.common.level, { n: level }) }, { label: t.hub.modules.writing.title }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{fmt(t.writing.title, { n: level })}</h1>
        <p className="max-w-2xl text-muted">{t.writing.intro}</p>
      </div>
      <WritingClient chars={chars} lessons={lessonCount(level)} />
    </div>
  );
}
