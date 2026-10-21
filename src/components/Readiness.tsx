"use client";

import { isLearned, useProgress } from "@/lib/progress";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { wordId } from "@/lib/levels";

/** One line per exam part: learned vocabulary, best drill scores and the best mock exam, against the 80% target. */
export function Readiness({ level, words }: { level: number; words: number }) {
  const { words: wp, tests } = useProgress();
  const { t } = useI18n();
  let learned = 0;
  for (let n = 1; n <= words; n++) if (isLearned(wp[wordId(level, n)])) learned++;
  const rows: { label: string; pct: number | null }[] = [
    { label: t.readiness.vocab, pct: Math.round((100 * learned) / words) },
    { label: t.readiness.listening, pct: tests[`3-${level}-listening`]?.best ?? null },
    { label: t.readiness.reading, pct: tests[`3-${level}-reading`]?.best ?? null },
    ...(level >= 2 ? [{ label: t.readiness.writing, pct: tests[`3-${level}-writing`]?.best ?? null }] : []),
    { label: t.readiness.mock, pct: tests[`3-${level}-mock`]?.best ?? null },
  ];
  return (
    <section aria-labelledby="readiness" className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <h2 id="readiness" className="eyebrow">{t.readiness.title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.label} className="flex flex-col gap-1.5">
            <span className="flex justify-between gap-2 text-sm">
              <span>{r.label}</span>
              <span className={`tabular-nums ${r.pct === null ? "text-muted" : r.pct >= 80 ? "font-semibold text-ok" : r.pct >= 60 ? "font-semibold" : "font-semibold text-danger"}`}>
                {r.pct === null ? t.readiness.none : r === rows[0] ? `${r.pct}%` : fmt(t.readiness.best, { n: r.pct })}
              </span>
            </span>
            <span className="relative h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${r.pct ?? 0}%`}>
              <span className="block h-full rounded-full bg-accent" style={{ width: `${r.pct ?? 0}%` }} />
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">{t.readiness.tip}</p>
    </section>
  );
}
