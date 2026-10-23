"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Example, Word } from "@/lib/types";
import { ToneScope } from "../ToneScope";
import { WordList } from "./WordList";
import { Flashcards } from "./Flashcards";
import { LessonTest, type PoolWord } from "./LessonTest";

const TABS = ["words", "cards", "test"] as const;
type Tab = (typeof TABS)[number];

export function LessonClient({ words, pool, examples, testKey }: { words: Word[]; pool: PoolWord[]; examples: Record<string, Example[]>; testKey: string }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("words");
  return (
    <ToneScope className="flex flex-col gap-5">
      <div role="tablist" aria-label={t.hub.modules.lessons.title} className="flex gap-1 self-start rounded-xl border border-line bg-surface p-1">
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            id={`tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            onClick={() => setTab(k)}
            onKeyDown={(e) => {
              const i = TABS.indexOf(k);
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
            tabIndex={tab === k ? 0 : -1}
            className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${tab === k ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
          >
            {t.lesson.tabs[k]}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "words" && <WordList words={words} examples={examples} />}
        {tab === "cards" && <Flashcards words={words} />}
        {tab === "test" && <LessonTest words={words} pool={pool} examples={examples} testKey={testKey} />}
      </div>
    </ToneScope>
  );
}
