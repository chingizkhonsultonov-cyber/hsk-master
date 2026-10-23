"use client";

import Link from "next/link";
import { LevelProgress } from "./LevelProgress";
import { useProgress } from "@/lib/progress";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { lessonStatus } from "./LessonLinks";

export function LessonTile({ href, title, sub, preview, ids, testKey }: { href: string; title: string; sub: string; preview: string; ids: string[]; testKey: string }) {
  const { tests } = useProgress();
  const { t } = useI18n();
  const best = tests[testKey];
  const done = lessonStatus(best) === "done";
  return (
    <Link href={href} data-status={lessonStatus(best)} className={`flex h-full flex-col gap-3 rounded-xl border p-4 hover:border-accent ${done ? "border-ok bg-ok/10" : "border-line bg-surface"}`}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">
          {title}
          {done && <span className="ml-2 text-xs font-semibold text-ok">✓ {t.lessons.completed}</span>}
        </span>
        <span className="text-xs text-muted tabular-nums">{sub}</span>
      </span>
      <span lang="zh-CN" className="han truncate text-lg text-muted">{preview}</span>
      <LevelProgress ids={ids} />
      {best && <span className="text-xs text-muted tabular-nums">{fmt(t.lessons.test, { n: best.best, total: best.total })}</span>}
    </Link>
  );
}
