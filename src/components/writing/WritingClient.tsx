"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { ToneScope } from "../ToneScope";
import { CharacterPad } from "./CharacterPad";
import { ToneDrill } from "./ToneDrill";

export interface CharEntry {
  /** character */ c: string;
  /** its syllable in the teaching word */ s: string;
  /** lesson */ l: number;
  /** teaching word, its pinyin and first meaning */ w: string;
  wp: string;
  m: string;
}

export function WritingClient({ chars, lessons }: { chars: CharEntry[]; lessons: number }) {
  const { t } = useI18n();
  const { writing } = useProgress();
  const [lesson, setLesson] = useState(1);
  const inLesson = chars.filter((c) => c.l === lesson);
  const [current, setCurrent] = useState<string | undefined>(inLesson[0]?.c);
  const entry = inLesson.find((c) => c.c === current) ?? inLesson[0];

  return (
    <ToneScope className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-4">
        <label htmlFor="lesson-select" className="flex flex-col gap-1 text-sm font-semibold text-muted">
          {t.writing.pickLesson}
          <select
            id="lesson-select"
            value={lesson}
            onChange={(e) => {
              const l = Number(e.target.value);
              setLesson(l);
              setCurrent(chars.find((c) => c.l === l)?.c);
            }}
            className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-ink"
          >
            {Array.from({ length: lessons }, (_, i) => (
              <option key={i} value={i + 1}>
                {fmt(t.common.lesson, { n: i + 1 })}
              </option>
            ))}
          </select>
        </label>
        <div role="group" aria-label={t.hub.modules.writing.title} className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {inLesson.map((c) => (
            <button
              key={c.c}
              type="button"
              lang="zh-CN"
              aria-pressed={c.c === entry?.c}
              data-char={c.c}
              onClick={() => setCurrent(c.c)}
              className={`han relative h-12 w-12 rounded-lg border text-2xl ${c.c === entry?.c ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface hover:border-muted"}`}
            >
              {c.c}
              {writing[c.c] && <span aria-hidden="true" className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-ok" />}
            </button>
          ))}
        </div>
      </div>
      {entry && <CharacterPad key={entry.c} entry={entry} />}
      <section aria-labelledby="tones-h" className="flex flex-col gap-4 border-t border-line pt-8">
        <div className="flex flex-col gap-1">
          <h2 id="tones-h" className="text-xl font-semibold">{t.writing.tonesTitle}</h2>
          <p className="text-sm text-muted">{t.writing.tonesIntro}</p>
        </div>
        <ToneDrill chars={chars.filter((c) => c.l <= lesson + 2)} />
      </section>
    </ToneScope>
  );
}
