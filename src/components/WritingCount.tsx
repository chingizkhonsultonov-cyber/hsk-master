"use client";

import { useProgress } from "@/lib/progress";
import { LEVEL_CHARS } from "@/data/level-chars";

/** How many of a level's characters have been written successfully at least once. */
export function WritingCount({ level }: { level: number }) {
  const { writing } = useProgress();
  const chars = LEVEL_CHARS[level];
  const done = [...chars].filter((c) => writing[c]).length;
  const pct = Math.round((100 * done) / chars.length);
  return (
    <span className="flex flex-col gap-1.5">
      <span className="h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${pct}%`}>
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs text-muted tabular-nums">
        {done} / {chars.length}
      </span>
    </span>
  );
}
