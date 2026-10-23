"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";

/** A lesson counts as completed once its test is passed with 80% or more. */
export const PASS = 0.8;

export function lessonStatus(r: { best: number; total: number } | undefined) {
  return !r ? "new" : r.best / r.total >= PASS ? "done" : "tried";
}

/**
 * Every lesson of a level as links, marked with the learner's progress: tiles with a word preview,
 * or compact numbered squares for long levels and the jump row on lesson pages.
 */
export function LessonLinks({ base, level, previews, compact = false, current }: { base: string; level: number; previews: string[]; compact?: boolean; current?: number }) {
  const { tests } = useProgress();
  const { t } = useI18n();
  const items = previews.map((preview, i) => {
    const n = i + 1;
    const r = tests[`3-${level}-L${n}`];
    return { n, preview, r, status: lessonStatus(r) };
  });
  const done = items.filter((x) => x.status === "done").length;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted tabular-nums" data-testid="lessons-done">
        {fmt(t.lessons.doneCount, { n: done, total: items.length })} · {t.lessons.passNote}
      </p>
      {compact ? (
        <ol className="flex flex-wrap gap-1.5">
          {items.map(({ n, preview, status }) => (
            <li key={n}>
              <Link
                href={`${base}/${n}`}
                title={preview}
                aria-current={n === current ? "page" : undefined}
                aria-label={`${fmt(t.common.lesson, { n })}${status === "done" ? ` · ${t.lessons.completed}` : ""}`}
                data-status={status}
                className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-semibold tabular-nums ${
                  n === current ? "border-ink bg-ink text-paper" : status === "done" ? "border-ok bg-ok/10 text-ok hover:border-accent" : status === "tried" ? "border-muted bg-surface hover:border-accent" : "border-line bg-surface hover:border-accent"
                }`}
              >
                {status === "done" && n !== current ? `✓${n}` : n}
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {items.map(({ n, preview, r, status }) => (
            <li key={n}>
              <Link
                href={`${base}/${n}`}
                data-status={status}
                className={`flex h-full flex-col gap-0.5 rounded-lg border px-3 py-2 hover:border-accent ${status === "done" ? "border-ok bg-ok/10" : "border-line bg-surface"}`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{fmt(t.common.lesson, { n })}</span>
                  {status === "done" ? (
                    <span className="text-xs font-semibold text-ok">✓ {t.lessons.completed}</span>
                  ) : (
                    r && <span className="text-xs text-muted tabular-nums">{r.best}/{r.total}</span>
                  )}
                </span>
                <span lang="zh-CN" className="han truncate text-sm text-muted">{preview}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
