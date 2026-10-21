"use client";

import { isDue, isLearned, useProgress } from "@/lib/progress";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";

/** Learned/due counts for a set of word ids, as a bar and a line of text. */
export function LevelProgress({ ids: given, level, total, showDue = true }: { ids?: string[]; level?: number; total?: number; showDue?: boolean }) {
  const progress = useProgress();
  // Word ids follow the official list order: 2-<level>-<1..total>
  const ids = given ?? Array.from({ length: total ?? 0 }, (_, i) => `2-${level}-${i + 1}`);
  const { t } = useI18n();
  const learned = ids.filter((id) => isLearned(progress.words[id])).length;
  const due = ids.filter((id) => isDue(progress.words[id])).length;
  const pct = ids.length ? Math.round((100 * learned) / ids.length) : 0;
  return (
    <span className="flex flex-col gap-1.5">
      <span className="h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${pct}%`}>
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
      <span className="flex flex-wrap justify-between gap-x-3 text-xs text-muted tabular-nums">
        <span>{fmt(t.common.learned, { n: learned, total: ids.length })}</span>
        {showDue && due > 0 && <span className="font-semibold text-accent">{fmt(t.common.due, { n: due })}</span>}
      </span>
    </span>
  );
}
