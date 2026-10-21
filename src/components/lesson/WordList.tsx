"use client";

import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import type { Word } from "@/lib/types";
import { Hanzi, Pinyin } from "../Hanzi";
import { Meaning } from "../Meaning";
import { SpeakButton } from "../SpeakButton";

export function WordList({ words }: { words: Word[] }) {
  const { t } = useI18n();
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {words.map((w) => (
        <li key={w.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-1 p-4 sm:grid-cols-[7rem_10rem_minmax(0,1fr)_auto] sm:items-center">
          <Hanzi h={w.h} p={w.p} className="row-span-3 text-3xl leading-tight sm:row-span-1" />
          <Pinyin p={w.p} className="text-lg" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <Meaning w={w} className="text-ink" />
            <span className="flex flex-wrap gap-x-3 text-xs text-muted">
              {w.cl.length > 0 && <span>{fmt(t.lesson.measure, { m: w.cl.join("、") })}</span>}
              {w.t !== w.h && <span lang="zh-TW">{fmt(t.lesson.traditional, { t: w.t })}</span>}
            </span>
            {w.dict.length > 0 && (
              <details className="text-xs text-muted">
                <summary className="cursor-pointer select-none">{t.lesson.more}</summary>
                <span lang="en">{w.dict.join("; ")}</span>
              </details>
            )}
          </span>
          <span className="col-start-2 sm:col-start-auto">
            <SpeakButton text={w.h} compact />
          </span>
        </li>
      ))}
    </ul>
  );
}
