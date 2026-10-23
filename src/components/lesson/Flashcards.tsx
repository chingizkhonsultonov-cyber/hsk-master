"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { getProgress, intervalDays, rateWord, type Grade } from "@/lib/progress";
import { updateSettings, useSettings } from "@/lib/settings";
import type { Word } from "@/lib/types";
import { shuffle } from "@/lib/random";
import { Hanzi, Pinyin } from "../Hanzi";
import { Meaning } from "../Meaning";
import { SpeakButton } from "../SpeakButton";
import { Tianzige } from "../Tianzige";

const GRADES: Grade[] = ["again", "hard", "good", "easy"];

export type CardWord = Pick<Word, "id" | "h" | "p" | "en" | "ru">;
/** Which side is shown first: the characters, the meaning, or a random mix per card. */
export type CardFront = "hanzi" | "meaning" | "mixed";

/** Due and new words first, then the rest of the lesson; Again puts a card back three places later. */
function buildQueue(words: CardWord[], order: "smart" | "random") {
  if (order === "random") return shuffle(words).map((w) => w.id);
  const p = getProgress().words;
  const now = Date.now();
  const rank = (w: CardWord) => (p[w.id] ? (p[w.id].due <= now ? 0 : 2) : 1);
  return [...words].sort((a, b) => rank(a) - rank(b)).map((w) => w.id);
}

function dealFronts(words: CardWord[], front: CardFront): Record<string, "hanzi" | "meaning"> {
  return Object.fromEntries(words.map((w) => [w.id, front === "mixed" ? (Math.random() < 0.5 ? "hanzi" : "meaning") : front]));
}

export function Flashcards({ words, order = "smart", front = "hanzi", onNewSet }: { words: CardWord[]; order?: "smart" | "random"; front?: CardFront; onNewSet?: () => void }) {
  const { t } = useI18n();
  const { pinyinFront } = useSettings();
  const byId = useMemo(() => Object.fromEntries(words.map((w) => [w.id, w])), [words]);
  const [queue, setQueue] = useState<string[]>(() => buildQueue(words, order));
  const [fronts] = useState(() => dealFronts(words, front));
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const showRef = useRef<HTMLButtonElement>(null);
  const goodRef = useRef<HTMLButtonElement>(null);
  const w = queue.length ? byId[queue[0]] : null;
  const prog = w ? getProgress().words[w.id] : undefined;
  const meaningFirst = !!w && fronts[w.id] === "meaning";

  const reveal = () => setRevealed(true);
  const rate = (g: Grade) => {
    if (!w) return;
    rateWord(w.id, g);
    setDone((d) => d + 1);
    setRevealed(false);
    setQueue((q) => {
      const rest = q.slice(1);
      if (g === "again") rest.splice(Math.min(3, rest.length), 0, w.id);
      return rest;
    });
  };

  useEffect(() => {
    (revealed ? goodRef : showRef).current?.focus({ preventScroll: true });
  }, [revealed, w?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!w || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest("input, select, textarea, details")) return;
      if (!revealed && e.key === " ") {
        e.preventDefault();
        reveal();
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        rate(GRADES[Number(e.key) - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const label = (g: Grade) => {
    const d = intervalDays(prog, g);
    if (d < 1 / 24) return fmt(t.cards.minutes, { n: Math.round(d * 1440) });
    if (d < 1) return fmt(t.cards.hours, { n: Math.round(d * 24) });
    return fmt(t.cards.days, { n: Math.round(d) });
  };

  if (!w) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-surface px-5 py-12 text-center">
        <span aria-hidden="true" className="han text-5xl text-accent">好</span>
        <h2 className="text-xl font-semibold">{onNewSet ? t.practice.done : t.cards.done}</h2>
        <p className="max-w-md text-muted">{onNewSet ? t.practice.doneBody : t.cards.doneBody}</p>
        <button
          type="button"
          onClick={() => { if (onNewSet) onNewSet(); else { setQueue(buildQueue(words, order)); setDone(0); } }}
          className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-paper"
        >
          {onNewSet ? t.practice.newSet : t.cards.restart}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      <article key={w.id + String(revealed)} className="enter flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex justify-between text-sm text-muted tabular-nums">
          <span>{prog ? t.cards.review : t.cards.newWord}</span>
          <span data-testid="remaining">{fmt(t.cards.remaining, { n: queue.length })}</span>
        </div>
        <div className="flex flex-col items-center gap-4 text-center" aria-live="polite">
          {meaningFirst && !revealed ? (
            <div className="flex min-h-44 items-center sm:min-h-52">
              <Meaning w={w} className="max-w-md text-2xl font-semibold" />
            </div>
          ) : (
            <Tianzige className="grid w-44 place-items-center sm:w-52">
              {revealed ? <Hanzi h={w.h} p={w.p} className={`relative ${[...w.h].length > 2 ? "text-4xl" : [...w.h].length > 1 ? "text-6xl" : "text-8xl"}`} /> : (
                <span lang="zh-CN" className={`han relative ${[...w.h].length > 2 ? "text-4xl" : [...w.h].length > 1 ? "text-6xl" : "text-8xl"}`}>{w.h}</span>
              )}
            </Tianzige>
          )}
          {(revealed || (pinyinFront && !meaningFirst)) && <Pinyin p={w.p} className="text-2xl" />}
          {revealed ? (
            <>
              <Meaning w={w} className="max-w-md text-lg" />
              <SpeakButton text={w.h} py={w.p} />
            </>
          ) : (
            <p className="text-sm text-muted">{meaningFirst ? t.cards.promptMeaning : t.cards.prompt}</p>
          )}
        </div>
        {revealed ? (
          <div role="group" aria-label={t.cards.rateLabel} className="grid grid-cols-4 gap-2">
            {GRADES.map((g, i) => (
              <button
                key={g}
                ref={g === "good" ? goodRef : undefined}
                type="button"
                data-grade={g}
                onClick={() => rate(g)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-lg border px-1 text-sm font-semibold hover:border-muted ${g === "again" ? "border-danger/50" : g === "good" ? "border-accent/60" : "border-line"}`}
              >
                {t.cards[g]}
                <span className="text-xs font-normal text-muted tabular-nums">
                  {label(g)} · <kbd className="font-sans">{i + 1}</kbd>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <button ref={showRef} type="button" onClick={reveal} className="min-h-12 rounded-lg bg-accent font-semibold text-paper">
            {t.cards.show} <kbd className="ml-1 rounded border border-current px-1 text-xs">Space</kbd>
          </button>
        )}
      </article>
      <aside className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
          <span className="text-sm text-muted tabular-nums">{done} / {done + queue.length}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-line">
            <span className="block h-full bg-accent" style={{ width: `${(100 * done) / (done + queue.length)}%` }} />
          </span>
        </div>
        <label htmlFor="pinyin-front" className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface p-4 text-sm">
          <input id="pinyin-front" type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={pinyinFront} onChange={(e) => updateSettings({ pinyinFront: e.target.checked })} />
          {t.cards.showPinyin}
        </label>
        <p className="px-1 text-xs text-muted">
          {t.common.keys}: <kbd>Space</kbd>, <kbd>1</kbd>–<kbd>4</kbd>
        </p>
      </aside>
    </div>
  );
}
