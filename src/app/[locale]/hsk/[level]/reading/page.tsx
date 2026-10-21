import type { Metadata } from "next";
import { getDictionary, fmt } from "@/lib/i18n";
import { Crumbs } from "@/components/Crumbs";
import { ToneScope } from "@/components/ToneScope";
import { DrillPractice } from "@/components/drill/DrillPractice";
import type { Locale } from "@/lib/types";
import { levelName, levelNumber, levelSlug, parseLevel } from "@/lib/levels";

type P = { params: Promise<{ locale: Locale; level: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level: raw } = await params;
  const level = parseLevel(raw) ?? 1;
  return { title: fmt(getDictionary(locale).reading.title, { n: levelNumber(level) }) };
}

export default async function Reading({ params }: P) {
  const { locale, level: raw } = await params;
  const level = parseLevel(raw)!;
  const slug = levelSlug(level);
  const t = getDictionary(locale);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Crumbs items={[{ href: `/${locale}`, label: t.common.appName }, { href: `/${locale}/hsk/${slug}`, label: levelName(level) }, { label: t.hub.modules.reading.title }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{fmt(t.reading.title, { n: levelNumber(level) })}</h1>
        <p className="max-w-2xl text-muted">{t.reading.intro}</p>
      </div>
      <ToneScope>
        <DrillPractice level={level} slug={slug} sections={["reading", "writing"]} />
      </ToneScope>
    </div>
  );
}
