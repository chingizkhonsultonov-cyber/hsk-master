"use client";

import Link from "next/link";
import { LevelProgress } from "./LevelProgress";
import { useProgress } from "@/lib/progress";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";

export function LessonTile({ href, title, sub, preview, ids, testKey }: { href: string; title: string; sub: string; preview: string; ids: string[]; testKey: string }) {
  const { tests } = useProgress();
  const { t } = useI18n();
  const best = tests[testKey];
  return (
    <Link href={href} className="flex h-full flex-col gap-3 rounded-xl border border-line bg-surface p-4 hover:border-accent">
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{title}</span>
        <span className="text-xs text-muted tabular-nums">{sub}</span>
      </span>
      <span lang="zh-CN" className="han truncate text-lg text-muted">{preview}</span>
      <LevelProgress ids={ids} />
      {best && <span className="text-xs text-muted tabular-nums">{fmt(t.lessons.test, { n: best.best, total: best.total })}</span>}
    </Link>
  );
}
