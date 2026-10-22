import Link from "next/link";
import { OpenCue } from "@/components/OpenCue";
import { getDictionary, count } from "@/lib/i18n";
import { levelSummary } from "@/lib/data";
import { LEVEL_NUMBERS, levelName, levelSlug } from "@/lib/levels";
import { LevelProgress } from "@/components/LevelProgress";
import type { Locale } from "@/lib/types";

const LEVEL_GLYPH = ["一", "二", "三", "四", "五", "六", "高"];

export default async function Dashboard({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">{t.dashboard.standard}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.dashboard.title}</h1>
        <p className="max-w-2xl text-muted">{t.dashboard.intro}</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LEVEL_NUMBERS.map((n, i) => {
          const s = levelSummary(n);
          return (
            <li key={n}>
              <Link
                href={`/${locale}/hsk/${levelSlug(n)}`}
                className="group flex h-full flex-col gap-4 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="text-2xl font-semibold tracking-tight">{levelName(n)}</span>
                    <span className="text-sm text-muted">
                      {t.dashboard.levelLabels[i]}
                    </span>
                  </span>
                  <span aria-hidden="true" className="han text-4xl leading-none text-muted group-hover:text-accent">
                    {LEVEL_GLYPH[i]}
                  </span>
                </span>
                <span className="text-sm text-muted tabular-nums">
                  {count(t.common.words, s.words, locale)} · {count(t.common.lessons, s.lessons, locale)}
                </span>
                <LevelProgress level={n} total={s.words} />
                <OpenCue label={t.common.open} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
